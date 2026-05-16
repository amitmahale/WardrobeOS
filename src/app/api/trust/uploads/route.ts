import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { listUploadRecoveries, recordTrustEvent, upsertUploadRecovery } from "@/lib/trust/repository";
import { requireTrustContext } from "@/lib/trust/server";

const uploadSchema = z.object({
  uploadId: z.string().min(1),
  filename: z.string().min(1),
  status: z.enum(["pending", "saved", "failed", "recovered", "ignored"]).default("pending"),
  stage: z.string().min(1).default("selected"),
  itemId: z.string().uuid().nullish(),
  storagePath: z.string().nullish(),
  publicUrl: z.string().nullish(),
  errorMessage: z.string().nullish(),
  metadata: z.record(z.unknown()).default({})
});

export async function GET() {
  try {
    const auth = await requireTrustContext();
    if ("error" in auth) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    }

    const uploads = await listUploadRecoveries(auth.service as any, auth.context);
    return NextResponse.json({ uploads });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTrustContext();
    if ("error" in auth) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    }

    const payload = uploadSchema.parse(await request.json());
    const upload = await upsertUploadRecovery(auth.service as any, auth.context, {
      ...payload,
      metadata: payload.metadata as any
    });
    await recordTrustEvent(auth.service as any, auth.context, {
      eventType: `upload.${payload.status}`,
      severity: payload.status === "failed" ? "error" : "info",
      route: payload.metadata?.route as string | undefined,
      itemId: payload.itemId || null,
      uploadId: payload.uploadId,
      message: payload.errorMessage || `${payload.filename} ${payload.status}`,
      metadata: {
        filename: payload.filename,
        stage: payload.stage,
        storagePath: payload.storagePath || null
      }
    });
    return NextResponse.json({ upload }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
