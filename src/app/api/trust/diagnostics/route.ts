import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { listRecentTrustEvents, listUploadRecoveries } from "@/lib/trust/repository";
import { requireTrustContext } from "@/lib/trust/server";

export async function GET() {
  try {
    const auth = await requireTrustContext();
    if ("error" in auth) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 });
    }

    const service = auth.service as any;
    const [{ count: itemCount, error: itemError }, { data: imageRows, error: imageError }, recentEvents, uploads] =
      await Promise.all([
        service.from("items").select("id", { count: "exact", head: true }).eq("closet_id", auth.closet.id),
        service.from("items").select("id,item_images(id)").eq("closet_id", auth.closet.id),
        listRecentTrustEvents(service, auth.context),
        listUploadRecoveries(service, auth.context)
      ]);
    if (itemError) throw itemError;
    if (imageError) throw imageError;

    const imageCount = (imageRows || []).reduce((sum: number, row: { item_images?: unknown[] }) => sum + (row.item_images?.length || 0), 0);
    const unresolvedUploadCount = uploads.filter((upload) => upload.status === "pending" || upload.status === "failed").length;

    return NextResponse.json({
      diagnostics: {
        user: { id: auth.user.id, email: auth.user.email || null },
        closet: { id: auth.closet.id, name: auth.closet.name },
        deployment: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_URL || "local",
        itemCount: itemCount || 0,
        imageCount,
        unresolvedUploadCount,
        recentEvents,
        uploads
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
