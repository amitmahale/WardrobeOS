import { NextResponse } from "next/server";
import { createPlaceholderImage } from "@/lib/domain/placeholderImage";
import { itemSchema } from "@/lib/validation/schemas";
import { jsonError } from "@/lib/api";
import { createId } from "@/lib/utils";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { createWardrobeItem, ensureDefaultCloset } from "@/lib/supabase/wardrobe-repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = itemSchema.parse(body);
    const imagePath = typeof body.imagePath === "string" ? body.imagePath : null;
    const supabase = await createSupabaseSsrClient();
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      const service = createSupabaseServiceRoleClient();
      const closet = await ensureDefaultCloset(service as any, data.user.id, data.user.email);
      const item = await createWardrobeItem(
        service as any,
        closet.id,
        {
          ...payload,
          brand: payload.brand || "",
          fitNotes: payload.fitNotes || "",
          secondaryColor: payload.secondaryColor || null,
          imageData: null,
          imageName: imagePath?.split("/").at(-1) || ""
        },
        imagePath
      );
      return NextResponse.json({ item }, { status: 201 });
    }

    const now = new Date().toISOString();
    const item = {
      id: createId("itm"),
      ...payload,
      brand: payload.brand || "",
      fitNotes: payload.fitNotes || "",
      secondaryColor: payload.secondaryColor || null,
      imageData: createPlaceholderImage(payload),
      wearCount: 0,
      lastWornAt: null,
      createdAt: now,
      updatedAt: now
    };
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
