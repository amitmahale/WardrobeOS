import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ensureDefaultCloset } from "@/lib/supabase/wardrobe-repository";
import { listSavedVisualizations } from "@/lib/supabase/visualization-repository";

export async function GET() {
  try {
    const supabase = await createSupabaseSsrClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    }

    const db = createSupabaseServiceRoleClient() as any;
    const closet = await ensureDefaultCloset(db, data.user.id, data.user.email);
    const visualizations = await listSavedVisualizations(db, closet.id);
    return NextResponse.json({ count: visualizations.length, visualizations });
  } catch (error) {
    return jsonError(error);
  }
}
