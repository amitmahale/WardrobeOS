import { AppShell } from "@/components/app-shell";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (process.env.E2E_AUTH_BYPASS === "1" && cookieStore.get("e2e-auth-bypass")?.value === "1") {
    return <AppShell userEmail={null}>{children}</AppShell>;
  }

  const supabase = await createSupabaseSsrClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return <AppShell userEmail={data.user.email}>{children}</AppShell>;
}
