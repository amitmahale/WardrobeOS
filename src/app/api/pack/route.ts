import { NextResponse } from "next/server";
import { createSeedItems } from "@/lib/demoData";
import { getPackPlan } from "@/lib/domain/packingPlanner";
import { jsonError } from "@/lib/api";
import { packQuerySchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = packQuerySchema.parse(body);
    const query = {
      ...parsed,
      primaryOccasion: parsed.primaryOccasions?.[0] ?? parsed.primaryOccasion
    };
    const items = Array.isArray(body.items) ? body.items : createSeedItems();
    const plan = getPackPlan(items, query);
    return NextResponse.json({
      packingList: plan.items.map((item) => ({ itemId: item.id })),
      outfitCount: plan.outfitCount,
      note: plan.note,
      counts: plan.counts
    });
  } catch (error) {
    return jsonError(error);
  }
}
