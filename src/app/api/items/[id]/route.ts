import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { ensureDefaultCloset, updateWardrobeItem } from "@/lib/supabase/wardrobe-repository";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { WardrobeItem } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseSsrClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    }

    const patch = (await request.json()) as Partial<WardrobeItem>;
    const service = createSupabaseServiceRoleClient();
    const closet = await ensureDefaultCloset(service as any, data.user.id, data.user.email);
    const item = await updateWardrobeItem(service as any, id, patch, closet.id);
    return NextResponse.json({ item });
  } catch (error) {
    return jsonError(error);
  }
}
