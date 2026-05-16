import type { Json } from "@/lib/supabase/database.types";

export type TrustSeverity = "info" | "warning" | "error";
export type UploadRecoveryStatus = "pending" | "saved" | "failed" | "recovered" | "ignored";

export type TrustEvent = {
  id: string;
  eventType: string;
  severity: TrustSeverity;
  route: string | null;
  itemId: string | null;
  uploadId: string | null;
  message: string | null;
  metadata: Json;
  createdAt: string;
};

export type UploadRecoveryEntry = {
  id: string;
  itemId: string | null;
  uploadId: string;
  filename: string;
  storagePath: string | null;
  publicUrl: string | null;
  status: UploadRecoveryStatus;
  stage: string;
  errorMessage: string | null;
  metadata: Json;
  createdAt: string;
  updatedAt: string;
};

export type TrustDiagnostics = {
  user: { id: string; email: string | null };
  closet: { id: string; name: string };
  deployment: string;
  itemCount: number;
  imageCount: number;
  unresolvedUploadCount: number;
  recentEvents: TrustEvent[];
  uploads: UploadRecoveryEntry[];
};
