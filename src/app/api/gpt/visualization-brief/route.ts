import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateGptRequest, gptJsonError, hasScope } from "@/lib/gpt/oauth";
import { buildVisualizationBrief, loadGptWardrobe } from "@/lib/gpt/wardrobe";

const schema = z.object({
  itemIds: z.array(z.string()).min(1).max(8),
  note: z.string().max(800).optional()
});

export async function POST(request: Request) {
  try {
    const auth = await authenticateGptRequest(request);
    hasScope(auth, "outfits:suggest");
    const payload = schema.parse(await request.json());
    const context = await loadGptWardrobe(auth.userId);
    return NextResponse.json(buildVisualizationBrief(context, payload.itemIds, payload.note));
  } catch (error) {
    return gptJsonError(error);
  }
}
