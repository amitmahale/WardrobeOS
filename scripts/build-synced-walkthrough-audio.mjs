import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

loadEnvFile(".env.local");

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const ttsModel = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const voiceName = process.env.GEMINI_TTS_VOICE || "Kore";
const outputRoot = path.resolve("artifacts/walkthroughs");
const steps = [
  ["home", 7, "WardrobeOS now opens with a calmer, cleaner homepage. The product is organized around real wardrobe decisions instead of a technical dashboard."],
  ["login", 8, "I sign in with a fresh dummy account, using the same email code flow a beta user would see."],
  ["today", 7, "The Today screen starts with one recommendation, one reason, and the next best action. The health rings make the closet status easy to scan."],
  ["add-single", 10, "Next I add a single item. The image uploads, the item autosaves to the server, and metadata can be reviewed before saving."],
  ["bulk", 9, "Bulk upload still works for multiple items. The workflow keeps the review step, but the lighter design makes it easier to follow."],
  ["closet", 8, "Closet is now a cleaner catalog. Search and the most useful filters are up front, with advanced filters tucked away until needed."],
  ["style", 9, "Style keeps the outfit engine, scores, save actions, wear tracking, and GPT try-on handoff, but presents them as visual outfit cards."],
  ["plan", 9, "Plan uses Robinhood-style decision clarity only where it helps: this buy-next card shows unlocks, confidence, gaps, and owned pieces it pairs with."],
  ["pack", 7, "The packing planner is still here. It builds a compact trip capsule from owned pieces while respecting weather, laundry, and shoe limits."],
  ["insights", 7, "Insights keeps the deeper analysis: occasion coverage, duplicates, and underused items."],
  ["gpt", 8, "GPT Stylist remains available for closet-aware prompts and visual try-on workflows, now as an advanced styling tool."],
  ["reliability", 7, "Reliability still protects the upload workflow with diagnostics and recovery actions."],
  ["finish", 7, "Back on Today, the cleaned up app feels more like a daily wardrobe companion while preserving the full feature set."]
].map(([key, seconds, text]) => ({ key, seconds, text }));

if (!geminiApiKey) throw new Error("Missing GEMINI_API_KEY or GOOGLE_API_KEY for Gemini TTS.");

const runDir = process.env.WALKTHROUGH_RUN_DIR
  ? path.resolve(process.env.WALKTHROUGH_RUN_DIR)
  : await latestWalkthroughDir();
const audioDir = path.join(runDir, "audio");
await fs.mkdir(audioDir, { recursive: true });

const silentVideoPath = path.join(runDir, "wardrobeos-new-ui-silent.webm");
if (!existsSync(silentVideoPath)) throw new Error(`Missing silent video: ${silentVideoPath}`);

const audioPath = await buildGeminiNarration(runDir, audioDir);
const finalPath = path.join(runDir, "wardrobeos-new-ui-synced-walkthrough.mp4");
await muxVideoAudio(silentVideoPath, audioPath, finalPath);
await fs.writeFile(path.join(runDir, "timeline.json"), JSON.stringify(steps, null, 2));
await fs.writeFile(
  path.join(runDir, "voiceover-script.txt"),
  steps.map((step, index) => `${index + 1}. [${step.seconds}s] ${step.text}`).join("\n\n")
);
console.log(JSON.stringify({ runDir, audioPath, finalPath }, null, 2));

async function buildGeminiNarration(runDir, audioDir) {
  const listPath = path.join(audioDir, "concat.txt");
  const exactSegmentPaths = [];

  for (const [index, step] of steps.entries()) {
    const prefix = `${String(index + 1).padStart(2, "0")}-${step.key}`;
    const rawPath = path.join(audioDir, `${prefix}-raw.wav`);
    const exactPath = path.join(audioDir, `${prefix}.wav`);
    if (!existsSync(rawPath)) {
      await synthesizeGeminiSpeechWithRetry(step.text, rawPath);
    }
    await fitAudioDuration(rawPath, exactPath, step.seconds);
    exactSegmentPaths.push(exactPath);
  }

  await fs.writeFile(listPath, exactSegmentPaths.map((filePath) => `file '${filePath.replaceAll("'", "'\\''")}'`).join("\n"));
  const audioPath = path.join(runDir, "wardrobeos-new-ui-gemini-voiceover.wav");
  await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", audioPath]);
  return audioPath;
}

async function synthesizeGeminiSpeechWithRetry(text, outPath) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const result = await synthesizeGeminiSpeech(text, outPath);
    if (result.ok) return;
    const waitSeconds = result.retryAfterSeconds || Math.min(90, 20 * attempt);
    console.log(`Gemini TTS rate limited; waiting ${waitSeconds}s before retry ${attempt + 1}.`);
    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
  }
  throw new Error(`Gemini TTS failed after retries for: ${text}`);
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
  if (response.status === 429) {
    const detail = await response.text();
    return { ok: false, retryAfterSeconds: retryAfterSeconds(detail) };
  }
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
  return { ok: true };
}

function retryAfterSeconds(detail) {
  const match = detail.match(/retry in ([0-9.]+)s/i) || detail.match(/"retryDelay":\s*"([0-9.]+)s"/i);
  if (!match) return 45;
  return Math.ceil(Number(match[1]) + 3);
}

async function fitAudioDuration(inputPath, outputPath, seconds) {
  await run("ffmpeg", ["-y", "-i", inputPath, "-af", `apad,atrim=0:${seconds}`, "-ar", "48000", "-ac", "2", outputPath]);
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

async function latestWalkthroughDir() {
  const entries = await fs.readdir(outputRoot);
  const dirs = entries.map((entry) => path.join(outputRoot, entry)).filter((entry) => existsSync(path.join(entry, "wardrobeos-new-ui-silent.webm")));
  dirs.sort().reverse();
  if (!dirs[0]) throw new Error("No walkthrough run with a silent video found.");
  return dirs[0];
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
