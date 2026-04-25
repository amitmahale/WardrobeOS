import { NextResponse } from "next/server";
import { authenticateGptRequest, gptJsonError, hasScope } from "@/lib/gpt/oauth";
import { buildGptOutfitSuggestions, loadGptWardrobe, parseOutfitQueryFromSearchParams } from "@/lib/gpt/wardrobe";

export async function GET(request: Request) {
  try {
    const auth = await authenticateGptRequest(request);
    hasScope(auth, "outfits:suggest");
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") || 8);
    const context = await loadGptWardrobe(auth.userId);
    const suggestions = buildGptOutfitSuggestions(context, parseOutfitQueryFromSearchParams(url.searchParams), limit);
    return NextResponse.json({
      closet: context.closet,
      count: suggestions.length,
      suggestions
    });
  } catch (error) {
    return gptJsonError(error);
  }
}
