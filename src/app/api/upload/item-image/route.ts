import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";
import { createId } from "@/lib/utils";

const uploadSchema = z.object({
  imageData: z.string().min(1),
  filename: z.string().default("item.jpg")
});

export async function POST(request: Request) {
  try {
    const payload = uploadSchema.parse(await request.json());
    const supabase = await createSupabaseSsrClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    }

    const parsed = parseDataUrl(payload.imageData);
    const extension = parsed.mimeType === "image/png" ? "png" : parsed.mimeType === "image/webp" ? "webp" : "jpg";
    const safeName = payload.filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || `item.${extension}`;
    const path = `${data.user.id}/items/${createId("img")}-${safeName.replace(/\.[^.]+$/, "")}.${extension}`;

    const { error } = await supabase.storage.from("item-images").upload(path, parsed.buffer, {
      contentType: parsed.mimeType,
      upsert: false
    });

    if (error) throw error;

    const {
      data: { publicUrl }
    } = supabase.storage.from("item-images").getPublicUrl(path);

    return NextResponse.json({ path, publicUrl });
  } catch (error) {
    return jsonError(error);
  }
}

function parseDataUrl(value: string) {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) throw new Error("Invalid image data.");
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}
