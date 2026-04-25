import { NextResponse } from "next/server";
import { z } from "zod";
import { suggestBulkItemTagsFromImages } from "@/lib/ai/tagging";
import { jsonError } from "@/lib/api";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";

const schema = z.object({
  images: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        imageData: z.string().min(1),
        filename: z.string().nullish()
      })
    )
    .min(1)
    .max(50)
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseSsrClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    }

    const payload = schema.parse(await request.json());
    const result = await suggestBulkItemTagsFromImages(payload.images);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
