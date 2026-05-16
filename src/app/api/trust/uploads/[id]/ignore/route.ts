import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getUploadRecovery, recordTrustEvent, updateUploadRecoveryStatus } from "@/lib/trust/repository";
import { requireTrustContext } from "@/lib/trust/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTrustContext();
    if ("error" in auth) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    }

    const { id } = await params;
    const upload = await getUploadRecovery(auth.service as any, auth.context, id);
    const updated = await updateUploadRecoveryStatus(auth.service as any, auth.context, id, {
      status: "ignored",
      stage: "ignored"
    });
    await recordTrustEvent(auth.service as any, auth.context, {
      eventType: "upload.ignored",
      uploadId: upload.uploadId,
      message: `${upload.filename} dismissed from recovery.`,
      metadata: { uploadRecoveryId: id }
    });

    return NextResponse.json({ upload: updated });
  } catch (error) {
    return jsonError(error);
  }
}
