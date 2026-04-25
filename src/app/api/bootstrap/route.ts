import { NextResponse } from "next/server";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ensureDefaultCloset, listWardrobeItems } from "@/lib/supabase/wardrobe-repository";
import { jsonError } from "@/lib/api";

export async function GET() {
  try {
    const supabase = await createSupabaseSsrClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json({ user: null, closet: null, items: [] });
    }

    const service = createSupabaseServiceRoleClient();
    const closet = await ensureDefaultCloset(service as any, data.user.id, data.user.email);
    const items = await listWardrobeItems(service as any, closet.id);
    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email
      },
      closet,
      items
    });
  } catch (error) {
    return jsonError(error);
  }
}
