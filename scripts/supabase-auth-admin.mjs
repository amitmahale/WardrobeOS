#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

loadEnvFile(".env.local");

const [command, rawEmail, providedPassword] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();

if (!["otp", "password"].includes(command || "") || !email) {
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

if (command === "otp") {
  if (!code) throw new Error("Supabase did not return a one-time code.");
  console.log(`Email: ${email}`);
  console.log(`One-time code: ${code}`);
  console.log("Enter this code in the PWA login screen. Do not click an email link.");
  process.exit(0);
}

const password = providedPassword || randomPassword();
if (password.length < 8) {
  throw new Error("Password must be at least 8 characters.");
}

const updated = await admin.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true
});

if (updated.error) throw updated.error;

const outputPath = resolve(process.cwd(), `.admin-auth-${email.replace(/[^a-z0-9._-]+/gi, "_")}.txt`);
writeFileSync(
  outputPath,
  [
    "Wardrobe OS admin auth bootstrap",
    `Email: ${email}`,
    `Password: ${password}`,
    "",
    "Use this password on https://wardrobeos.vercel.app/login under Password fallback.",
    "This file is gitignored. Delete it after saving the password somewhere safe."
  ].join("\n"),
  { mode: 0o600 }
);

console.log(`Password sign-in enabled for ${email}.`);
console.log(`Password written to ${outputPath}`);

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

function randomPassword() {
  return `Wo-${randomBytes(18).toString("base64url")}`;
}

function printUsageAndExit() {
  console.error("Usage:");
  console.error("  npm run auth:otp -- user@example.com");
  console.error("  npm run auth:password -- user@example.com [optional-password]");
  process.exit(1);
}
