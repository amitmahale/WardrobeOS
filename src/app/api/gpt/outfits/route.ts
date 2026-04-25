import { NextResponse } from "next/server";
import { authenticateGptRequest, gptJsonError, hasScope } from "@/lib/gpt/oauth";
import { loadGptSavedOutfits } from "@/lib/gpt/wardrobe";

export async function GET(request: Request) {
  try {
    const auth = await authenticateGptRequest(request);
    hasScope(auth, "outfits:read");
    const { context, outfits } = await loadGptSavedOutfits(auth.userId);
    return NextResponse.json({
      closet: context.closet,
      count: outfits.length,
      outfits
    });
  } catch (error) {
    return gptJsonError(error);
  }
}
