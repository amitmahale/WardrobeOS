import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ensureDefaultCloset } from "@/lib/supabase/wardrobe-repository";

const saveOutfitSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  itemIds: z.array(z.string()).min(1),
  occasion: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = saveOutfitSchema.parse(await request.json());
    const supabase = await createSupabaseSsrClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    }

    const db = createSupabaseServiceRoleClient() as any;
    const closet = await ensureDefaultCloset(db, data.user.id, data.user.email);
    const outfit = await db
      .from("saved_outfits")
      .insert({
        closet_id: closet.id,
        name: payload.name,
        source: "recommendation",
        occasion: payload.occasion || null
      })
      .select("id")
      .single();

    if (outfit.error) throw outfit.error;

    const rows = payload.itemIds.map((itemId, index) => ({
      outfit_id: outfit.data.id,
      item_id: itemId,
      slot: `slot_${index + 1}`
    }));
    const items = await db.from("saved_outfit_items").insert(rows);
    if (items.error) throw items.error;

    return NextResponse.json({ ok: true, outfitId: outfit.data.id });
  } catch (error) {
    return jsonError(error);
  }
}
