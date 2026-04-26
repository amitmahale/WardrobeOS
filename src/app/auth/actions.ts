"use server";

import { redirect } from "next/navigation";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";

export type AuthActionState = { message?: string; error?: string };
const MIN_OTP_LENGTH = 6;
const MAX_OTP_LENGTH = 8;

export async function signInWithMagicLink(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const supabase = await createSupabaseSsrClient();
  const origin = getAuthRedirectOrigin(formData);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=/app/dashboard`
    }
  });

  if (error) return { error: toLoginErrorMessage(error.message) };
  return { message: "Email code sent. Enter the code here to sign in inside this app." };
}

export async function verifyEmailOtp(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const token = String(formData.get("token") || "").replace(/\D/g, "");
  if (!email) return { error: "Email is required." };
  if (token.length < MIN_OTP_LENGTH || token.length > MAX_OTP_LENGTH) {
    return { error: `Enter the ${MIN_OTP_LENGTH}-${MAX_OTP_LENGTH} digit code from your email.` };
  }

  const supabase = await createSupabaseSsrClient();
  const otpTypes = ["email", "magiclink", "signup"] as const;
  let lastError: Error | null = null;
  for (const type of otpTypes) {
    const { error } = await supabase.auth.verifyOtp({ email, token, type });
    if (!error) redirect("/app/dashboard");
    lastError = error;
  }

  return { error: lastError?.message || "Code is invalid or expired. Request a fresh code and do not click the email link." };
}

export async function signOut() {
  const supabase = await createSupabaseSsrClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function getAuthRedirectOrigin(formData: FormData) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const submitted = String(formData.get("origin") || "").trim();
  const fallback = configured || submitted || "http://localhost:3000";

  try {
    return new URL(fallback).origin;
  } catch {
    return "http://localhost:3000";
  }
}

function toLoginErrorMessage(message: string) {
  if (/signups not allowed/i.test(message)) {
    return "This email is not on the WardrobeOS beta access list yet. Ask the owner to add the account, then request a fresh email code.";
  }
  return message;
}
