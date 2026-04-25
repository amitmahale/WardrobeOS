import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseServerClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createClient<Database, "public">(url, anonKey, {
    auth: {
      persistSession: false
    }
  });
}

export function createSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role is not configured.");
  }
  return createClient<Database, "public">(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
