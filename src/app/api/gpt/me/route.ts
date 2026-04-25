import { NextResponse } from "next/server";
import { authenticateGptRequest, gptJsonError, hasScope } from "@/lib/gpt/oauth";
import { loadGptWardrobe } from "@/lib/gpt/wardrobe";

export async function GET(request: Request) {
  try {
    const auth = await authenticateGptRequest(request);
    hasScope(auth, "closet:read");
    const context = await loadGptWardrobe(auth.userId);
    return NextResponse.json({
      user: context.profile,
      closet: {
        ...context.closet,
        activeItemCount: context.items.filter((item) => item.status === "active").length,
        totalItemCount: context.items.length
      }
    });
  } catch (error) {
    return gptJsonError(error);
  }
}
