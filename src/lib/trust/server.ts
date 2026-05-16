import { createSupabaseSsrClient } from "@/lib/supabase/ssr";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ensureDefaultCloset } from "@/lib/supabase/wardrobe-repository";

export async function requireTrustContext() {
  const supabase = await createSupabaseSsrClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "unauthorized" as const };

  const service = createSupabaseServiceRoleClient();
  const closet = await ensureDefaultCloset(service as any, data.user.id, data.user.email);
  return {
    service,
    user: data.user,
    closet,
    context: {
      userId: data.user.id,
      closetId: closet.id
    }
  };
}
