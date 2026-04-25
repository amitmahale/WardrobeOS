import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { suggestItemTagsFromImage } from "@/lib/ai/tagging";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";

const schema = z.object({
  imageData: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseSsrClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    }

    const payload = schema.parse(await request.json());
    const result = await suggestItemTagsFromImage(payload.imageData);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
