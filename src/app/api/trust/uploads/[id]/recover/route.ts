import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { createWardrobeItem } from "@/lib/supabase/wardrobe-repository";
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
    if (!upload.storagePath) {
      return NextResponse.json(
        { error: { code: "not_recoverable", message: "This upload does not have a stored image to recover." } },
        { status: 409 }
      );
    }

    const item = await createWardrobeItem(
      auth.service as any,
      auth.closet.id,
      {
        name: nameFromFilename(upload.filename),
        category: "top",
        subcategory: "",
        primaryColor: "navy",
        secondaryColor: null,
        pattern: "solid",
        material: "cotton",
        warmth: 2,
        formality: 2,
        seasons: ["spring", "fall"],
        occasions: ["casual"],
        fitNotes: "Recovered from an interrupted upload. Review and update tags.",
        imageData: null,
        imageName: upload.filename,
        brand: ""
      },
      upload.storagePath
    );

    const recovery = await updateUploadRecoveryStatus(auth.service as any, auth.context, id, {
      status: "recovered",
      stage: "recovered",
      itemId: item.id,
      errorMessage: null
    });
    await recordTrustEvent(auth.service as any, auth.context, {
      eventType: "upload.recovered",
      itemId: item.id,
      uploadId: upload.uploadId,
      message: `${upload.filename} recovered to closet.`,
      metadata: { uploadRecoveryId: id }
    });

    return NextResponse.json({ item, upload: recovery });
  } catch (error) {
    return jsonError(error);
  }
}

function nameFromFilename(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  if (!base) return "Recovered item";
  return base.replace(/\b\w/g, (character) => character.toUpperCase());
}
