import { NextResponse } from "next/server";
import { createSeedItems } from "@/lib/demoData";
import { getPurchaseSuggestions } from "@/lib/domain/purchaseSimulator";
import { jsonError } from "@/lib/api";
import { purchaseQuerySchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = purchaseQuerySchema.parse(body);
    const query = {
      ...parsed,
      preferredCategory: parsed.preferredCategories?.[0] ?? parsed.preferredCategory
    };
    const items = Array.isArray(body.items) ? body.items : createSeedItems();
    return NextResponse.json({
      recommendations: getPurchaseSuggestions(items, query).slice(0, 10)
    });
  } catch (error) {
    return jsonError(error);
  }
}
