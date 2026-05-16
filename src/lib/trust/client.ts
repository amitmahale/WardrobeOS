import type { UploadRecoveryStatus } from "@/lib/trust/types";

type UploadTrustInput = {
  uploadId: string;
  filename: string;
  status: UploadRecoveryStatus;
  stage: string;
  itemId?: string | null;
  storagePath?: string | null;
  publicUrl?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
};

export function createUploadId(prefix = "upl") {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

export async function recordUploadTrust(input: UploadTrustInput) {
  try {
    await fetch("/api/trust/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
  } catch {
    // Trust logging must not block the upload path.
  }
}

export async function recordClientEvent(input: {
  eventType: string;
  severity?: "info" | "warning" | "error";
  route?: string | null;
  itemId?: string | null;
  uploadId?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await fetch("/api/trust/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
  } catch {
    // Best-effort diagnostics only.
  }
}
