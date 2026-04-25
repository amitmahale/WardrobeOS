import { NextResponse } from "next/server";
import { confirmUploadSchema } from "@/lib/validation/schemas";
import { jsonError } from "@/lib/api";
import { createId } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const payload = confirmUploadSchema.parse(await request.json());
    return NextResponse.json({
      image: {
        id: createId("img"),
        status: "processing",
        path: payload.path
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
