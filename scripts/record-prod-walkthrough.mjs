import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { chromium, expect } from "@playwright/test";

const siteUrl = process.env.WARDROBEOS_WALKTHROUGH_URL || "https://wardrobeos.vercel.app";
const outputRoot = path.resolve("artifacts/walkthroughs");
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const runDir = path.join(outputRoot, runId);
const assetDir = path.join(runDir, "assets");
const videoDir = path.join(runDir, "video");
const email = `wardrobeos-walkthrough-${Date.now()}@example.com`;

loadEnvFile(".env.local");

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

let userId = null;
let browser = null;
let context = null;

try {
  await fs.mkdir(assetDir, { recursive: true });
  await fs.mkdir(videoDir, { recursive: true });
  await writeSampleImages();

  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true
  });
  if (created.error) throw created.error;
  userId = created.data.user.id;

  browser = await launchBrowser();
  context = await browser.newContext({
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
    viewport: { width: 1440, height: 900 },
    locale: "en-US"
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);

  await page.goto(siteUrl);
  await narrate(page, "Open the production WardrobeOS app.");
  await page.getByRole("link", { name: /sign in|login|get started|open app/i }).first().click().catch(async () => {
    await page.goto(`${siteUrl}/login?next=/app/dashboard`);
  });
  await page.waitForURL(/\/login/, { timeout: 15_000 }).catch(async () => {
    await page.goto(`${siteUrl}/login?next=/app/dashboard`);
  });

  await narrate(page, "Sign in with a throwaway beta account.");
  await page.locator("#email").fill(email);
  await page.getByRole("button", { name: /send email code/i }).click();
  await page.getByText(/email code sent/i).waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
  const code = await generateOtp(email);
  await page.locator("#token").fill(code);
  await page.getByRole("button", { name: /verify code/i }).click();
  await page.waitForURL(/\/app\/dashboard/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await narrate(page, "Dashboard loads from the server-backed closet.");
  await page.waitForTimeout(1200);
  if (await page.getByRole("button", { name: /wore today/i }).first().isVisible().catch(() => false)) {
    await page.getByRole("button", { name: /wore today/i }).first().click();
    await page.waitForTimeout(1000);
  }

  await gotoApp(page, "/app/items/new", "Add a single item, upload an image, autosave it, and save reviewed metadata.");
  await uploadFile(page, "#item-image", path.join(assetDir, "single-shirt.png"));
  await expect(page.getByText(/autosaved to your closet|ai tags applied|autosave failed/i).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  await page.locator("#name").fill("Walkthrough Single Shirt");
  await page.locator("#subcategory").fill("shirt");
  await page.locator("#material").fill("cotton");
  await page.getByRole("button", { name: /^save item$/i }).click();
  await page.waitForURL(/\/app\/items\//, { timeout: 30_000 });
  await expect(page.locator("h1").first()).toBeVisible();

  await gotoApp(page, "/app/items/bulk", "Bulk upload two items and verify each image autosaves before review.");
  await uploadFile(page, "#bulk-images", [
    path.join(assetDir, "bulk-navy-pants.png"),
    path.join(assetDir, "bulk-cream-jacket.png")
  ]);
  await expect(page.getByText(/autosaved to your closet/i).first()).toBeVisible({ timeout: 45_000 });
  await page.getByLabel(/item name for bulk-navy-pants/i).fill("Walkthrough Navy Pants");
  await page.getByLabel(/item name for bulk-cream-jacket/i).fill("Walkthrough Cream Jacket");
  await page.getByRole("button", { name: /save reviewed items/i }).click();
  await expect(page.getByText(/saved to closet/i).first()).toBeVisible({ timeout: 30_000 });

  await gotoApp(page, "/app/closet", "Closet shows the uploaded single and bulk items after navigation.");
  await expect(page.getByText(/Walkthrough|single|bulk|shirt|pants|jacket/i).first()).toBeVisible();
  await page.locator("#filter-search").fill("Walkthrough");
  await page.waitForTimeout(800);
  await page.locator("#filter-view").selectOption("list");
  await page.waitForTimeout(1000);
  await page.locator("#filter-search").fill("");

  await gotoApp(page, "/app/outfits", "Outfit Lab generates explainable outfit recommendations.");
  await page.waitForTimeout(1500);

  await gotoApp(page, "/app/pack", "Pack Planner builds a trip capsule.");
  await page.locator("#trip-days").fill("5").catch(() => {});
  await page.waitForTimeout(1500);

  await gotoApp(page, "/app/buy-next", "Buy Next ranks useful purchase candidates.");
  await page.waitForTimeout(1500);

  await gotoApp(page, "/app/insights", "Insights summarizes closet gaps and underused items.");
  await page.waitForTimeout(1500);

  await gotoApp(page, "/app/gpt-stylist", "GPT Stylist exposes closet-aware prompts.");
  await page.waitForTimeout(1500);

  await gotoApp(page, "/app/visualizations", "Visualizations page shows the save workflow for generated try-ons.");
  await page.waitForTimeout(1500);

  await gotoApp(page, "/app/reliability", "Reliability page shows diagnostics and the upload recovery center.");
  await expect(page.getByRole("heading", { name: "Reliability", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /refresh/i }).click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /copy report/i }).click();
  await expect(page.getByText(/diagnostic report copied/i)).toBeVisible();

  await gotoApp(page, "/app/settings", "Settings edits user preferences and integration status.");
  await page.locator('input:not([type="hidden"])').nth(0).fill("Walkthrough Tester").catch(() => {});
  await page.locator('input:not([type="hidden"])').nth(1).fill("Bay Area").catch(() => {});
  await page.locator("select").nth(1).selectOption("medium").catch(() => {});
  await page.waitForTimeout(1500);

  await gotoApp(page, "/app/dashboard", "Return to the dashboard with the completed walkthrough account.");
  await page.waitForTimeout(2000);

  const video = await page.video();
  await page.close();
  await context.close();
  context = null;
  await browser.close();
  browser = null;

  const rawVideoPath = await video.path();
  const finalVideoPath = path.join(runDir, "wardrobeos-prod-walkthrough.webm");
  await fs.rename(rawVideoPath, finalVideoPath);
  await fs.writeFile(
    path.join(runDir, "README.txt"),
    [
      "WardrobeOS production walkthrough",
      `URL: ${siteUrl}`,
      `Dummy account: ${email}`,
      `Recorded at: ${new Date().toISOString()}`,
      `Video: ${finalVideoPath}`,
      "",
      "The dummy Supabase user and uploaded storage files are cleaned up after recording."
    ].join("\n")
  );

  await cleanupUser();
  console.log(JSON.stringify({ videoPath: finalVideoPath, runDir, email }, null, 2));
} catch (error) {
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  await cleanupUser().catch(() => {});
  throw error;
}

async function gotoApp(page, route, note) {
  await page.goto(`${siteUrl}${route}`);
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByTestId("app-shell")).toHaveAttribute("data-hydrated", "true");
  await narrate(page, note);
  await page.waitForTimeout(700);
}

async function uploadFile(page, selector, files) {
  const chooserPromise = page.waitForEvent("filechooser", { timeout: 10_000 });
  await page.locator(selector).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(files);
}

async function narrate(page, text) {
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
        borderRadius: "12px",
        background: "rgba(7, 12, 24, 0.92)",
        color: "white",
        font: "600 16px/1.4 system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        boxShadow: "0 18px 50px rgba(0,0,0,0.35)"
      });
      document.body.appendChild(el);
    }
    el.textContent = message;
  }, text);
  await page.waitForTimeout(900);
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

async function launchBrowser() {
  const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (existsSync(chromePath)) {
    return chromium.launch({ executablePath: chromePath, headless: false, slowMo: 180 });
  }
  return chromium.launch({ headless: false, slowMo: 180 });
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
