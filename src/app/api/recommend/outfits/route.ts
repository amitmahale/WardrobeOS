import { NextResponse } from "next/server";
import { createSeedItems } from "@/lib/demoData";
import { getOutfitSuggestions } from "@/lib/domain/outfitGenerator";
import { jsonError } from "@/lib/api";
import { outfitQuerySchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = outfitQuerySchema.parse(body);
    const items = Array.isArray(body.items) ? body.items : createSeedItems();
    const recommendations = getOutfitSuggestions(items, query).slice(0, 10);
    return NextResponse.json({ query, recommendations });
  } catch (error) {
    return jsonError(error);
  }
}
