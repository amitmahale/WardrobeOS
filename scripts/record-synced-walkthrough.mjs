import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { chromium, expect } from "@playwright/test";

const siteUrl = process.env.WARDROBEOS_WALKTHROUGH_URL || "http://127.0.0.1:3000";
const outputRoot = path.resolve("artifacts/walkthroughs");
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const runDir = path.join(outputRoot, runId);
const assetDir = path.join(runDir, "assets");
const videoDir = path.join(runDir, "video");
const audioDir = path.join(runDir, "audio");
const email = `wardrobeos-walkthrough-${Date.now()}@example.com`;
const viewport = { width: 1440, height: 900 };

loadEnvFile(".env.local");

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const ttsModel = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const voiceName = process.env.GEMINI_TTS_VOICE || "Kore";
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const steps = [
  {
    key: "home",
    seconds: 7,
    text: "WardrobeOS now opens with a calmer, cleaner homepage. The product is organized around real wardrobe decisions instead of a technical dashboard."
  },
  {
    key: "login",
    seconds: 8,
    text: "I sign in with a fresh dummy account, using the same email code flow a beta user would see."
  },
  {
    key: "today",
    seconds: 7,
    text: "The Today screen starts with one recommendation, one reason, and the next best action. The health rings make the closet status easy to scan."
  },
  {
    key: "add-single",
    seconds: 10,
    text: "Next I add a single item. The image uploads, the item autosaves to the server, and metadata can be reviewed before saving."
  },
  {
    key: "bulk",
    seconds: 9,
    text: "Bulk upload still works for multiple items. The workflow keeps the review step, but the lighter design makes it easier to follow."
  },
  {
    key: "closet",
    seconds: 8,
    text: "Closet is now a cleaner catalog. Search and the most useful filters are up front, with advanced filters tucked away until needed."
  },
  {
    key: "style",
    seconds: 9,
    text: "Style keeps the outfit engine, scores, save actions, wear tracking, and GPT try-on handoff, but presents them as visual outfit cards."
  },
  {
    key: "plan",
    seconds: 9,
    text: "Plan uses Robinhood-style decision clarity only where it helps: this buy-next card shows unlocks, confidence, gaps, and owned pieces it pairs with."
  },
  {
    key: "pack",
    seconds: 7,
    text: "The packing planner is still here. It builds a compact trip capsule from owned pieces while respecting weather, laundry, and shoe limits."
  },
  {
    key: "insights",
    seconds: 7,
    text: "Insights keeps the deeper analysis: occasion coverage, duplicates, and underused items."
  },
  {
    key: "gpt",
    seconds: 8,
    text: "GPT Stylist remains available for closet-aware prompts and visual try-on workflows, now as an advanced styling tool."
  },
  {
    key: "reliability",
    seconds: 7,
    text: "Reliability still protects the upload workflow with diagnostics and recovery actions."
  },
  {
    key: "finish",
    seconds: 7,
    text: "Back on Today, the cleaned up app feels more like a daily wardrobe companion while preserving the full feature set."
  }
];

let userId = null;
let browser = null;
let context = null;
let page = null;

try {
  if (!geminiApiKey) throw new Error("Missing GEMINI_API_KEY or GOOGLE_API_KEY for Gemini TTS.");

  await fs.mkdir(assetDir, { recursive: true });
  await fs.mkdir(videoDir, { recursive: true });
  await fs.mkdir(audioDir, { recursive: true });
  await writeSampleImages();

  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true
  });
  if (created.error) throw created.error;
  userId = created.data.user.id;

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    recordVideo: { dir: videoDir, size: viewport },
    viewport,
    locale: "en-US"
  });
  page = await context.newPage();
  page.setDefaultTimeout(25_000);

  await runTimedStep("home", async () => {
    await page.goto(siteUrl);
    await expect(page.getByRole("heading", { name: /a calmer way to get dressed/i })).toBeVisible();
  });

  await runTimedStep("login", async () => {
    await page.goto(`${siteUrl}/login?next=/app/dashboard`);
    await page.locator("#email").fill(email);
    await page.getByRole("button", { name: /send email code/i }).click();
    await page.getByText(/email code sent/i).waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
    const code = await generateOtp(email);
    await page.locator("#token").fill(code);
    await page.getByRole("button", { name: /verify code/i }).click();
    await page.waitForURL(/\/app\/dashboard/, { timeout: 30_000 });
    await seedServerCloset();
    await page.goto(`${siteUrl}/app/dashboard`);
    await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  });

  await runTimedStep("today", async () => {
    await gotoApp("/app/dashboard");
    await page.getByText(/Get dressed with less thinking/i).waitFor({ state: "visible" });
  });

  await runTimedStep("add-single", async () => {
    await gotoApp("/app/items/new");
    await uploadFile("#item-image", path.join(assetDir, "single-shirt.png"));
    await page.getByText(/autosaved to your closet|ai tags applied|ai tagging/i).first().waitFor({ state: "visible", timeout: 35_000 });
    await page.locator("#name").fill("Walkthrough Single Shirt");
    await page.locator("#subcategory").fill("shirt");
    await page.locator("#material").fill("cotton");
    await page.getByRole("button", { name: /^save item$/i }).click();
    await page.waitForURL(/\/app\/items\//, { timeout: 30_000 });
    await expect(page.locator("h1").first()).toBeVisible();
  });

  await runTimedStep("bulk", async () => {
    await gotoApp("/app/items/bulk");
    await uploadFile("#bulk-images", [
      path.join(assetDir, "bulk-navy-pants.png"),
      path.join(assetDir, "bulk-cream-jacket.png")
    ]);
    await page.getByText(/autosaved to your closet/i).first().waitFor({ state: "visible", timeout: 45_000 });
    await page.getByLabel(/item name for bulk-navy-pants/i).fill("Walkthrough Navy Pants");
    await page.getByLabel(/item name for bulk-cream-jacket/i).fill("Walkthrough Cream Jacket");
    await page.locator('select[id$="-category"]').nth(0).selectOption("bottom");
    await page.locator('select[id$="-category"]').nth(1).selectOption("layer");
    await page.locator('input[id$="-subcategory"]').nth(0).fill("chinos");
    await page.locator('input[id$="-subcategory"]').nth(1).fill("jacket");
    await page.locator('select[id$="-color"]').nth(0).selectOption("navy");
    await page.locator('select[id$="-color"]').nth(1).selectOption("cream");
    await page.locator('input[id$="-material"]').nth(0).fill("cotton");
    await page.locator('input[id$="-material"]').nth(1).fill("cotton");
    await page.getByRole("button", { name: /save reviewed items/i }).click();
    await expect(page.getByText(/saved to closet/i).first()).toBeVisible({ timeout: 30_000 });
  });

  await runTimedStep("closet", async () => {
    await gotoApp("/app/closet");
    await page.locator("#filter-search").fill("Walkthrough");
    await page.locator("#filter-view").selectOption("list");
    await expect(page.getByText(/Walkthrough/i).first()).toBeVisible();
    await page.getByText("More filters").click();
  });

  await runTimedStep("style", async () => {
    await gotoApp("/app/outfits");
    await expect(page.getByRole("heading", { name: "Recommended outfits" })).toBeVisible();
    await page.getByRole("button", { name: /^Save$/i }).first().click();
  });

  await runTimedStep("plan", async () => {
    await gotoApp("/app/buy-next");
    await expect(page.getByTestId("purchase-card-image").first()).toBeVisible();
    await page.getByRole("button", { name: /save candidate/i }).first().click();
  });

  await runTimedStep("pack", async () => {
    await gotoApp("/app/pack");
    await expect(page.getByText(/Recommended capsule/i)).toBeVisible();
  });

  await runTimedStep("insights", async () => {
    await gotoApp("/app/insights");
    await expect(page.getByText(/Occasion coverage/i).first()).toBeVisible();
  });

  await runTimedStep("gpt", async () => {
    await gotoApp("/app/gpt-stylist");
    await expect(page.getByTestId("gpt-launchpad")).toBeVisible();
  });

  await runTimedStep("reliability", async () => {
    await gotoApp("/app/reliability");
    await expect(page.getByRole("heading", { name: "Reliability", exact: true })).toBeVisible();
    await page.getByRole("button", { name: /refresh/i }).click();
  });

  await runTimedStep("finish", async () => {
    await gotoApp("/app/dashboard");
    await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  });

  const video = await page.video();
  await page.close();
  await context.close();
  context = null;
  await browser.close();
  browser = null;

  const rawVideoPath = await video.path();
  const silentVideoPath = path.join(runDir, "wardrobeos-new-ui-silent.webm");
  await fs.rename(rawVideoPath, silentVideoPath);

  const audioPath = await buildGeminiNarration();
  const finalPath = path.join(runDir, "wardrobeos-new-ui-synced-walkthrough.mp4");
  await muxVideoAudio(silentVideoPath, audioPath, finalPath);

  await fs.writeFile(path.join(runDir, "timeline.json"), JSON.stringify(steps, null, 2));
  await fs.writeFile(
    path.join(runDir, "voiceover-script.txt"),
    steps.map((step, index) => `${index + 1}. [${step.seconds}s] ${step.text}`).join("\n\n")
  );
  await fs.writeFile(
    path.join(runDir, "README.txt"),
    [
      "WardrobeOS new UI synchronized walkthrough",
      `URL: ${siteUrl}`,
      `Dummy account: ${email}`,
      `Recorded at: ${new Date().toISOString()}`,
      `Final video: ${finalPath}`,
      `Silent video: ${silentVideoPath}`,
      `Narration audio: ${audioPath}`,
      `Gemini TTS model: ${ttsModel}`,
      `Gemini voice: ${voiceName}`,
      "",
      "The dummy Supabase user and uploaded storage files are cleaned up after recording."
    ].join("\n")
  );

  await cleanupUser();
  console.log(JSON.stringify({ finalPath, silentVideoPath, audioPath, runDir, email }, null, 2));
} catch (error) {
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  await cleanupUser().catch(() => {});
  throw error;
}

async function runTimedStep(key, action) {
  const step = steps.find((candidate) => candidate.key === key);
  if (!step) throw new Error(`Unknown walkthrough step: ${key}`);
  const started = Date.now();
  await action();
  await showCaption(step.text);
  const elapsed = Date.now() - started;
  await page.waitForTimeout(Math.max(0, step.seconds * 1000 - elapsed));
}

async function gotoApp(route) {
  await page.goto(`${siteUrl}${route}`);
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByTestId("app-shell")).toHaveAttribute("data-hydrated", "true");
}

async function uploadFile(selector, files) {
  const chooserPromise = page.waitForEvent("filechooser", { timeout: 10_000 });
  await page.locator(selector).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(files);
}

async function showCaption(text) {
  await page.evaluate((message) => {
    let el = document.getElementById("codex-walkthrough-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "codex-walkthrough-caption";
      Object.assign(el.style, {
        position: "fixed",
        left: "24px",
        bottom: "24px",
        zIndex: "2147483647",
        maxWidth: "620px",
        padding: "14px 18px",
        borderRadius: "18px",
        background: "rgba(17, 17, 17, 0.92)",
        color: "white",
        font: "700 16px/1.45 system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        boxShadow: "0 18px 50px rgba(0,0,0,0.25)"
      });
      document.body.appendChild(el);
    }
    el.textContent = message;
  }, text);
}

async function seedServerCloset() {
  const seedItems = [
    {
      name: "Walkthrough Navy Oxford",
      category: "top",
      subcategory: "oxford shirt",
      primaryColor: "navy",
      pattern: "solid",
      material: "cotton",
      warmth: 2,
      formality: 3,
      seasons: ["spring", "summer", "fall"],
      occasions: ["work", "smart-casual", "dinner", "travel"]
    },
    {
      name: "Walkthrough Khaki Chinos",
      category: "bottom",
      subcategory: "chinos",
      primaryColor: "khaki",
      pattern: "solid",
      material: "cotton",
      warmth: 2,
      formality: 3,
      seasons: ["spring", "summer", "fall"],
      occasions: ["work", "smart-casual", "dinner", "travel"]
    },
    {
      name: "Walkthrough Navy Blazer",
      category: "layer",
      subcategory: "blazer",
      primaryColor: "navy",
      pattern: "solid",
      material: "wool",
      warmth: 3,
      formality: 4,
      seasons: ["spring", "fall", "winter"],
      occasions: ["work", "smart-casual", "dinner", "formal"]
    },
    {
      name: "Walkthrough Brown Loafers",
      category: "shoes",
      subcategory: "loafers",
      primaryColor: "brown",
      pattern: "solid",
      material: "leather",
      warmth: 1,
      formality: 3,
      seasons: ["all"],
      occasions: ["work", "smart-casual", "dinner", "travel"]
    }
  ];

  await admin.from("profiles").upsert({
    id: userId,
    display_name: "Walkthrough Tester",
    updated_at: new Date().toISOString()
  });

  let closet = await admin
    .from("closets")
    .select("id, name")
    .eq("owner_user_id", userId)
    .eq("is_default", true)
    .maybeSingle();
  if (closet.error) throw closet.error;
  if (!closet.data) {
    const inserted = await admin
      .from("closets")
      .insert({ owner_user_id: userId, name: "Walkthrough Closet", slug: "walkthrough-closet", is_default: true })
      .select("id, name")
      .single();
    if (inserted.error) throw inserted.error;
    closet = inserted;
  }

  const member = await admin
    .from("closet_members")
    .upsert({ closet_id: closet.data.id, user_id: userId, role: "owner" }, { onConflict: "closet_id,user_id" });
  if (member.error) throw member.error;

  const rows = seedItems.map((item) => ({
    closet_id: closet.data.id,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory,
    primary_color: item.primaryColor,
    pattern: item.pattern,
    material: item.material,
    warmth: item.warmth,
    formality: item.formality,
    seasons: item.seasons,
    occasions: item.occasions,
    status: "active",
    metadata: { seededBy: "record-synced-walkthrough" }
  }));
  const inserted = await admin.from("items").insert(rows).select("name");
  if (inserted.error) throw inserted.error;
  console.log(`Seeded closet items: ${(inserted.data || []).map((item) => item.name).join(", ")}`);
}

async function buildGeminiNarration() {
  const listPath = path.join(audioDir, "concat.txt");
  const exactSegmentPaths = [];

  for (const [index, step] of steps.entries()) {
    const rawPath = path.join(audioDir, `${String(index + 1).padStart(2, "0")}-${step.key}-raw.wav`);
    const exactPath = path.join(audioDir, `${String(index + 1).padStart(2, "0")}-${step.key}.wav`);
    await synthesizeGeminiSpeech(step.text, rawPath);
    await fitAudioDuration(rawPath, exactPath, step.seconds);
    exactSegmentPaths.push(exactPath);
  }

  await fs.writeFile(listPath, exactSegmentPaths.map((filePath) => `file '${filePath.replaceAll("'", "'\\''")}'`).join("\n"));
  const audioPath = path.join(runDir, "wardrobeos-new-ui-gemini-voiceover.wav");
  await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", audioPath]);
  return audioPath;
}

async function synthesizeGeminiSpeech(text, outPath) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          }
        }
      })
    }
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini TTS failed: ${response.status} ${detail.slice(0, 500)}`);
  }
  const payload = await response.json();
  const part = payload.candidates?.[0]?.content?.parts?.find((candidate) => candidate.inlineData || candidate.inline_data);
  const inline = part?.inlineData || part?.inline_data;
  const data = inline?.data;
  if (!data) throw new Error("Gemini TTS response did not include inline audio data.");
  const audio = Buffer.from(data, "base64");
  if (inline.mimeType?.includes("wav") || inline.mime_type?.includes("wav")) {
    await fs.writeFile(outPath, audio);
  } else {
    await fs.writeFile(outPath, wavFromPcm(audio, 24_000, 1, 16));
  }
}

async function fitAudioDuration(inputPath, outputPath, seconds) {
  await run("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-af",
    `apad,atrim=0:${seconds}`,
    "-ar",
    "48000",
    "-ac",
    "2",
    outputPath
  ]);
}

async function muxVideoAudio(videoPath, audioPath, outputPath) {
  await run("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-i",
    audioPath,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "veryfast",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-shortest",
    outputPath
  ]);
}

function wavFromPcm(pcm, sampleRate, channels, bitsPerSample) {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function generateOtp(targetEmail) {
  const generated = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: targetEmail,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/app/dashboard` }
  });
  if (generated.error) throw generated.error;
  const code = generated.data?.properties?.email_otp;
  if (!code) throw new Error("Supabase did not return an OTP.");
  return code;
}

async function cleanupUser() {
  if (!userId) return;
  const listed = await admin.storage.from("item-images").list(`${userId}/items`, { limit: 100 });
  if (!listed.error && listed.data?.length) {
    await admin.storage
      .from("item-images")
      .remove(listed.data.map((entry) => `${userId}/items/${entry.name}`));
  }
  await admin.auth.admin.deleteUser(userId);
  userId = null;
}

async function writeSampleImages() {
  const oneByOnePng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64"
  );
  await fs.writeFile(path.join(assetDir, "single-shirt.png"), oneByOnePng);
  await fs.writeFile(path.join(assetDir, "bulk-navy-pants.png"), oneByOnePng);
  await fs.writeFile(path.join(assetDir, "bulk-cream-jacket.png"), oneByOnePng);
}

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "pipe" });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}\n${stderr}`));
    });
  });
}

function loadEnvFile(filePath) {
  const resolved = path.resolve(filePath);
  if (!existsSync(resolved)) return;
  for (const line of readFileSync(resolved, "utf8").split(/\r?\n/)) {
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
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}
