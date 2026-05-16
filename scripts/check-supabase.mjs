import dns from "node:dns/promises";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const expectedTables = [
  ["profiles", "id"],
  ["closets", "id"],
  ["closet_members", "id"],
  ["person_profiles", "id"],
  ["items", "id"],
  ["item_images", "id"],
  ["saved_outfits", "id"],
  ["saved_outfit_items", "id"],
  ["recommendation_feedback", "id"],
  ["closet_insight_snapshots", "id"],
  ["app_events", "id"],
  ["upload_recovery_entries", "id"],
  ["purchase_candidate_library", "key"],
  ["gpt_oauth_codes", "id"],
  ["gpt_oauth_refresh_tokens", "id"]
];

const args = process.argv.slice(2);
const envFile = args[args.indexOf("--env-file") + 1] || ".env.local";
const failures = [];
const warnings = [];

function loadEnv(path) {
  const values = {};
  const content = fs.readFileSync(path, "utf8");

  for (const rawLine of content.split(/\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index);
    const value = line.slice(index + 1).replace(/^['"]|['"]$/g, "");
    values[key] = value;
  }

  return values;
}

function redactUrl(value) {
  return value.replace(/\/\/([^./]+)\./, "//<project>.");
}

async function run() {
  const env = loadEnv(envFile);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("Supabase health check");
  console.log(`Env file: ${envFile}`);

  if (!url) failures.push("NEXT_PUBLIC_SUPABASE_URL is missing.");
  if (!anonKey) failures.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  if (!serviceRoleKey) failures.push("SUPABASE_SERVICE_ROLE_KEY is missing.");
  if (failures.length) return finish();

  const parsedUrl = new URL(url);
  console.log(`Project URL: ${redactUrl(url)}`);

  try {
    const addresses = await dns.lookup(parsedUrl.hostname, { all: true });
    console.log(`DNS: ok (${addresses.map((entry) => entry.family).join(", ")})`);
  } catch (error) {
    failures.push(`DNS lookup failed for configured Supabase host: ${error.code || error.message}`);
    return finish();
  }

  await checkFetch(`${url}/auth/v1/health`, "Auth health", {
    apikey: anonKey,
    authorization: `Bearer ${anonKey}`
  });
  await checkFetch(`${url}/rest/v1/`, "REST gateway", {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`
  });
  if (failures.length) return finish();

  const service = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  for (const [table, column] of expectedTables) {
    const { count, error } = await service.from(table).select(column, { count: "exact", head: true });
    if (error) failures.push(`Table ${table}: ${error.code || "error"} ${error.message}`);
    else console.log(`Table ${table}: ok (${count ?? 0} rows)`);

    if (table === "purchase_candidate_library" && typeof count === "number" && count < 5) {
      failures.push(`Table purchase_candidate_library has ${count} rows; expected at least 5 seed rows.`);
    }
  }

  const bucket = await service.storage.getBucket("item-images");
  if (bucket.error) {
    failures.push(`Storage bucket item-images: ${bucket.error.message}`);
  } else {
    console.log(`Storage bucket item-images: ok (${bucket.data.public ? "public" : "private"})`);
  }

  const users = await service.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (users.error) failures.push(`Auth admin listUsers: ${users.error.message}`);
  else console.log("Auth admin listUsers: ok");

  finish();
}

async function checkFetch(url, label, headers = {}) {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15_000)
    });

    if (response.ok) {
      console.log(`${label}: ok (${response.status}, ${Date.now() - start}ms)`);
      return;
    }

    const body = await response.text();
    failures.push(`${label}: ${response.status} ${response.statusText} ${body.slice(0, 160)}`.trim());
  } catch (error) {
    const detail = error.cause?.code || error.cause?.message || error.message;
    failures.push(`${label}: ${error.name} ${detail}`);
  }
}

function finish() {
  for (const warning of warnings) console.warn(`WARN ${warning}`);
  if (failures.length) {
    console.error("Result: FAIL");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log("Result: OK");
}

run().catch((error) => {
  console.error("Result: FAIL");
  console.error(`- ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
