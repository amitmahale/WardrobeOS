import { NextResponse } from "next/server";
import { uploadUrlSchema } from "@/lib/validation/schemas";
import { jsonError } from "@/lib/api";
import { createId } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = uploadUrlSchema.parse(await request.json());
    const extension = payload.filename.split(".").pop() || "jpg";
    const path = `item-originals/demo-user/${id}/${createId("upload")}.${extension}`;
    return NextResponse.json({
      uploadUrl: `/api/local-upload-placeholder/${path}`,
      path,
      headers: {
        "content-type": payload.contentType
      },
      expiresInSeconds: 7200
    });
  } catch (error) {
    return jsonError(error);
  }
}
