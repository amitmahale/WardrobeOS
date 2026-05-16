import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { TrustEvent, TrustSeverity, UploadRecoveryEntry, UploadRecoveryStatus } from "@/lib/trust/types";

type TypedSupabaseClient = SupabaseClient<Database, "public", any>;
type UploadRow = Database["public"]["Tables"]["upload_recovery_entries"]["Row"];
type EventRow = Database["public"]["Tables"]["app_events"]["Row"];

export type TrustContext = {
  userId: string;
  closetId: string;
};

export async function recordTrustEvent(
  supabase: TypedSupabaseClient,
  context: Partial<TrustContext>,
  input: {
    eventType: string;
    severity?: TrustSeverity;
    route?: string | null;
    itemId?: string | null;
    uploadId?: string | null;
    message?: string | null;
    metadata?: Json;
  }
) {
  const { data, error } = await supabase
    .from("app_events")
    .insert({
      user_id: context.userId || null,
      closet_id: context.closetId || null,
      event_type: input.eventType,
      severity: input.severity || "info",
      route: input.route || null,
      item_id: input.itemId || null,
      upload_id: input.uploadId || null,
      message: input.message || null,
      metadata: input.metadata || {}
    })
    .select("*")
    .single();
  if (error) throw error;
  return toTrustEvent(data);
}

export async function upsertUploadRecovery(
  supabase: TypedSupabaseClient,
  context: TrustContext,
  input: {
    uploadId: string;
    filename: string;
    status?: UploadRecoveryStatus;
    stage?: string;
    itemId?: string | null;
    storagePath?: string | null;
    publicUrl?: string | null;
    errorMessage?: string | null;
    metadata?: Json;
  }
) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("upload_recovery_entries")
    .upsert(
      {
        user_id: context.userId,
        closet_id: context.closetId,
        upload_id: input.uploadId,
        filename: input.filename,
        status: input.status || "pending",
        stage: input.stage || "selected",
        item_id: input.itemId || null,
        storage_path: input.storagePath || null,
        public_url: input.publicUrl || null,
        error_message: input.errorMessage || null,
        metadata: input.metadata || {},
        updated_at: now
      },
      { onConflict: "user_id,upload_id" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return toUploadRecoveryEntry(data);
}

export async function listRecentTrustEvents(supabase: TypedSupabaseClient, context: TrustContext, limit = 30) {
  const { data, error } = await supabase
    .from("app_events")
    .select("*")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(toTrustEvent);
}

export async function listUploadRecoveries(supabase: TypedSupabaseClient, context: TrustContext, limit = 50) {
  const { data, error } = await supabase
    .from("upload_recovery_entries")
    .select("*")
    .eq("user_id", context.userId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(toUploadRecoveryEntry);
}

export async function getUploadRecovery(supabase: TypedSupabaseClient, context: TrustContext, id: string) {
  const { data, error } = await supabase
    .from("upload_recovery_entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", context.userId)
    .single();
  if (error) throw error;
  return toUploadRecoveryEntry(data);
}

export async function updateUploadRecoveryStatus(
  supabase: TypedSupabaseClient,
  context: TrustContext,
  id: string,
  patch: {
    status: UploadRecoveryStatus;
    stage?: string;
    itemId?: string | null;
    errorMessage?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("upload_recovery_entries")
    .update({
      status: patch.status,
      stage: patch.stage,
      item_id: patch.itemId,
      error_message: patch.errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("user_id", context.userId)
    .select("*")
    .single();
  if (error) throw error;
  return toUploadRecoveryEntry(data);
}

export function toTrustEvent(row: EventRow): TrustEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    severity: row.severity,
    route: row.route,
    itemId: row.item_id,
    uploadId: row.upload_id,
    message: row.message,
    metadata: row.metadata,
    createdAt: row.created_at
  };
}

export function toUploadRecoveryEntry(row: UploadRow): UploadRecoveryEntry {
  return {
    id: row.id,
    itemId: row.item_id,
    uploadId: row.upload_id,
    filename: row.filename,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    status: row.status,
    stage: row.stage,
    errorMessage: row.error_message,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
