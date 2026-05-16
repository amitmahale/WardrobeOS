import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { recordTrustEvent } from "@/lib/trust/repository";
import { requireTrustContext } from "@/lib/trust/server";

const eventSchema = z.object({
  eventType: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]).default("info"),
  route: z.string().nullish(),
  itemId: z.string().uuid().nullish(),
  uploadId: z.string().nullish(),
  message: z.string().nullish(),
  metadata: z.record(z.unknown()).default({})
});

export async function POST(request: Request) {
  try {
    const auth = await requireTrustContext();
    if ("error" in auth) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    }

    const payload = eventSchema.parse(await request.json());
    const event = await recordTrustEvent(auth.service as any, auth.context, {
      ...payload,
      metadata: payload.metadata as any
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
