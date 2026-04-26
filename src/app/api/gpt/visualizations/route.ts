import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateGptRequest, gptJsonError, hasAnyScope } from "@/lib/gpt/oauth";
import { loadGptWardrobe } from "@/lib/gpt/wardrobe";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { createSavedVisualization, listSavedVisualizations } from "@/lib/supabase/visualization-repository";
import type { Occasion } from "@/lib/types";
import { createId } from "@/lib/utils";

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

const openaiFileRefSchema = z
  .object({
    name: z.string().optional(),
    id: z.string().optional(),
    mime_type: z.string().optional(),
    download_link: z.string().url().optional()
  })
  .passthrough();

const saveVisualizationSchema = z.object({
  title: z.string().min(1).max(140),
  occasion: z.enum(["casual", "smart-casual", "work", "dinner", "travel", "formal"]).optional(),
  itemIds: z.array(z.string()).min(1).max(8),
  prompt: z.string().min(1).max(4000),
  stylingNotes: z.string().max(4000).optional(),
  openaiFileIdRefs: z.array(openaiFileRefSchema).max(10).optional()
});

export async function GET(request: Request) {
  try {
    const auth = await authenticateGptRequest(request);
    hasAnyScope(auth, ["visualizations:read", "outfits:read"]);
    const context = await loadGptWardrobe(auth.userId);
    const db = createSupabaseServiceRoleClient() as any;
    const visualizations = await listSavedVisualizations(db, context.closet.id);
    return NextResponse.json({
      closet: context.closet,
      count: visualizations.length,
      visualizations
    });
  } catch (error) {
    return gptJsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateGptRequest(request);
    // Existing Custom GPT OAuth grants predate visualization scopes. Accept the older styling scope for this beta.
    hasAnyScope(auth, ["visualizations:write", "outfits:suggest"]);
    const payload = saveVisualizationSchema.parse(await request.json());
    const context = await loadGptWardrobe(auth.userId);
    const itemIds = validateItemIds(payload.itemIds, new Set(context.items.map((item) => item.id)));
    const image = await fetchFirstImage(payload.openaiFileIdRefs || [], auth.userId);
    const db = createSupabaseServiceRoleClient() as any;
    const created = await createSavedVisualization(db, context.closet.id, {
      title: payload.title,
      itemIds,
      occasion: payload.occasion as Occasion | undefined,
      prompt: payload.prompt,
      stylingNotes: payload.stylingNotes || "",
      imagePath: image?.path || null,
      imageUrl: image?.publicUrl || null,
      source: "chatgpt",
      openaiFileId: image?.fileId || null,
      openaiFileName: image?.fileName || null,
      mimeType: image?.mimeType || null
    });

    const visualizations = await listSavedVisualizations(db, context.closet.id);
    const visualization = visualizations.find((entry) => entry.id === created.id);
    return NextResponse.json({
      ok: true,
      visualization,
      appUrl: `${new URL(request.url).origin}/app/visualizations`
    });
  } catch (error) {
    return gptJsonError(error);
  }
}

function validateItemIds(itemIds: string[], allowedIds: Set<string>) {
  const unique = [...new Set(itemIds)];
  const invalid = unique.filter((id) => !allowedIds.has(id));
  if (invalid.length) throw new Error(`Unknown or inaccessible item ids: ${invalid.join(", ")}`);
  return unique;
}

async function fetchFirstImage(fileRefs: Array<z.infer<typeof openaiFileRefSchema>>, userId: string) {
  const imageRef = fileRefs.find((file) => {
    const mimeType = normalizeMimeType(file.mime_type || "");
    return file.download_link && mimeType && imageMimeTypes.includes(mimeType);
  });
  if (!imageRef?.download_link) return null;

  const url = new URL(imageRef.download_link);
  if (url.protocol !== "https:") throw new Error("Visualization image download link must be HTTPS.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Generated image download failed with status ${response.status}.`);
    const mimeType =
      normalizeMimeType(imageRef.mime_type || "") || normalizeMimeType(response.headers.get("content-type") || "");
    if (!mimeType || !imageMimeTypes.includes(mimeType)) {
      throw new Error("Only JPEG, PNG, and WebP visualization images can be saved.");
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > 10 * 1024 * 1024) throw new Error("Visualization image must be under 10MB.");

    const db = createSupabaseServiceRoleClient() as any;
    const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
    const baseName = safeBaseName(imageRef.name || "chatgpt-visualization");
    const path = `${userId}/visualizations/${createId("viz")}-${baseName}.${extension}`;
    const uploaded = await db.storage.from("item-images").upload(path, buffer, {
      contentType: mimeType,
      upsert: false
    });
    if (uploaded.error) throw uploaded.error;

    const {
      data: { publicUrl }
    } = db.storage.from("item-images").getPublicUrl(path);

    return {
      path,
      publicUrl,
      mimeType,
      fileId: imageRef.id || null,
      fileName: imageRef.name || null
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeMimeType(value: string) {
  const mimeType = value.split(";")[0]?.trim().toLowerCase();
  return imageMimeTypes.find((allowed) => allowed === mimeType) || null;
}

function safeBaseName(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80) || "chatgpt-visualization";
}
