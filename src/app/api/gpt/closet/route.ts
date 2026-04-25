import { NextResponse } from "next/server";
import { authenticateGptRequest, gptJsonError, hasScope } from "@/lib/gpt/oauth";
import { loadGptWardrobe } from "@/lib/gpt/wardrobe";

export async function GET(request: Request) {
  try {
    const auth = await authenticateGptRequest(request);
    hasScope(auth, "closet:read");
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "active";
    const category = url.searchParams.get("category");
    const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 100), 200));
    const context = await loadGptWardrobe(auth.userId);
    const items = context.items
      .filter((item) => (status === "all" ? true : item.status === status))
      .filter((item) => (category ? item.category === category : true))
      .slice(0, limit);

    return NextResponse.json({
      closet: context.closet,
      count: items.length,
      items
    });
  } catch (error) {
    return gptJsonError(error);
  }
}
