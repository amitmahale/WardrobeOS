import { NextResponse } from "next/server";
import { feedbackSchema } from "@/lib/validation/schemas";
import { jsonError } from "@/lib/api";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ensureDefaultCloset } from "@/lib/supabase/wardrobe-repository";

export async function POST(request: Request) {
  try {
    const payload = feedbackSchema.parse(await request.json());
    const supabase = await createSupabaseSsrClient();
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      const db = createSupabaseServiceRoleClient() as any;
      const closet = await ensureDefaultCloset(db, data.user.id, data.user.email);
      const { error } = await db.from("recommendation_feedback").insert({
        closet_id: closet.id,
        target_type: payload.targetType,
        target_key: payload.targetKey || payload.targetId || "unknown",
        feedback: payload.feedback,
        note: payload.note || null
      });
      if (error) throw error;
    }

    return NextResponse.json({ ok: true, feedback: payload });
  } catch (error) {
    return jsonError(error);
  }
}
