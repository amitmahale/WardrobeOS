import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ensureDefaultCloset } from "@/lib/supabase/wardrobe-repository";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseSsrClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    }
    const db = createSupabaseServiceRoleClient() as any;
    const closet = await ensureDefaultCloset(db, userData.user.id, userData.user.email);
    const { data, error } = await db
      .from("items")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("closet_id", closet.id)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (error) {
    return jsonError(error);
  }
}
