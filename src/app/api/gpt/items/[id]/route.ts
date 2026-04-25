import { NextResponse } from "next/server";
import { authenticateGptRequest, gptJsonError, hasScope } from "@/lib/gpt/oauth";
import { loadGptItem } from "@/lib/gpt/wardrobe";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateGptRequest(request);
    hasScope(auth, "closet:read");
    const { id } = await params;
    const { item } = await loadGptItem(auth.userId, id);
    if (!item) {
      return NextResponse.json({ error: { code: "not_found", message: "Item not found." } }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error) {
    return gptJsonError(error);
  }
}
