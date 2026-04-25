#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const port = process.env.PORT || "3100";
const baseUrl = process.env.ARCHITECTURE_EXPORT_BASE_URL || `http://127.0.0.1:${port}`;
const outputPath = process.env.ARCHITECTURE_PDF_PATH || "public/docs/wardrobeos-architecture-magazine.pdf";

let server = null;

try {
  if (!(await isReachable(baseUrl))) {
    server = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", port], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT: port }
    });
    await waitForServer(baseUrl);
  }

  await mkdir("public/docs", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
  await page.goto(`${baseUrl}/architecture-magazine`, { waitUntil: "networkidle" });
  await page.pdf({
    path: outputPath,
    format: "Letter",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" }
  });
  await browser.close();
  console.log(`Exported ${outputPath}`);
} finally {
  if (server) {
    server.kill("SIGTERM");
  }
}

async function isReachable(url) {
  try {
    const response = await fetch(url);
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(url) {
  const started = Date.now();
  while (Date.now() - started < 30_000) {
    if (await isReachable(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}
