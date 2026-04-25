import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const authError =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error") ||
    requestUrl.searchParams.get("auth_error");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (authError) {
    return redirectToLogin(requestUrl, authError, next);
  }

  if (code) {
    const supabase = await createSupabaseSsrClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return redirectToLogin(requestUrl, error.message, next);
  } else if (tokenHash && type) {
    const supabase = await createSupabaseSsrClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return redirectToLogin(requestUrl, error.message, next);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

function safeNextPath(next: string | null) {
  if (!next?.startsWith("/") || next.startsWith("//")) return "/app/dashboard";
  return next;
}

function redirectToLogin(requestUrl: URL, message: string, next = "/app/dashboard") {
  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set(
    "auth_error",
    `${message} Request a fresh email code and enter it in the app instead of clicking the email link.`
  );
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}
