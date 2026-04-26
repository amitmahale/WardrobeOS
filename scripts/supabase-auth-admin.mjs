#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

loadEnvFile(".env.local");

const [command, rawEmail] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();

if (command !== "otp" || !email) {
  printUsageAndExit();
}

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const siteUrl = normalizedOrigin(process.env.NEXT_PUBLIC_SITE_URL || "https://wardrobeos.vercel.app");
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const generated = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: { redirectTo: `${siteUrl}/auth/callback?next=/app/dashboard` }
});

if (generated.error) throw generated.error;

const user = generated.data?.user;
const code = generated.data?.properties?.email_otp;
if (!user?.id) throw new Error("Supabase did not return a user.");

if (!code) throw new Error("Supabase did not return a one-time code.");
console.log(`Email: ${email}`);
console.log(`One-time code: ${code}`);
console.log("Enter this code in the PWA login screen. Do not click an email link.");

function loadEnvFile(path) {
  const envPath = resolve(process.cwd(), path);
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. Add it to .env.local.`);
  return value;
}

function normalizedOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return "https://wardrobeos.vercel.app";
  }
}

function printUsageAndExit() {
  console.error("Usage:");
  console.error("  npm run auth:otp -- user@example.com");
  process.exit(1);
}
