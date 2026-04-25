import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ensureDefaultCloset } from "@/lib/supabase/wardrobe-repository";

const profileSchema = z.object({
  displayName: z.string().optional(),
  climate: z.string().optional(),
  defaultDressLevel: z.string().optional()
});

export async function PATCH(request: Request) {
  try {
    const payload = profileSchema.parse(await request.json());
    const supabase = await createSupabaseSsrClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    }

    const db = createSupabaseServiceRoleClient() as any;
    await ensureDefaultCloset(db, data.user.id, data.user.email);
    const { error } = await db
      .from("profiles")
      .update({
        ...(payload.displayName !== undefined ? { display_name: payload.displayName } : {}),
        ...(payload.climate !== undefined ? { climate_region: payload.climate } : {}),
        ...(payload.defaultDressLevel !== undefined ? { default_dress_level: payload.defaultDressLevel } : {}),
        updated_at: new Date().toISOString()
      })
      .eq("id", data.user.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
