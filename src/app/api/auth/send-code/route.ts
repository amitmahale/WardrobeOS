import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const sendCodeSchema = z.object({
  email: z.string().email(),
  next: z.string().optional()
});

const betaAccessMessage =
  "This email is not on the WardrobeOS beta access list yet. Ask the owner to add the account, then request a fresh email code.";

export async function POST(request: Request) {
  try {
    const payload = sendCodeSchema.parse(await request.json());
    const email = payload.email.trim().toLowerCase();
    const nextPath = safeNextPath(payload.next);
    const admin = createSupabaseServiceRoleClient() as any;
    const user = await findAuthUserByEmail(admin, email);

    if (!user) {
      return authError("not_invited", betaAccessMessage, 403);
    }

    if (!user.email_confirmed_at) {
      return authError(
        "account_pending_activation",
        "This WardrobeOS beta account is pending activation. Ask the owner to confirm it in Supabase, then request a fresh email code.",
        409
      );
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${getAuthRedirectOrigin(request)}/auth/callback?next=${encodeURIComponent(nextPath)}`
      }
    });

    if (error) {
      return authError("otp_failed", toLoginErrorMessage(error.message), 400);
    }

    return NextResponse.json({ message: "Email code sent. Enter the code here to sign in inside this app." });
  } catch (error) {
    return jsonError(error);
  }
}

async function findAuthUserByEmail(admin: any, email: string) {
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const result = await admin.auth.admin.listUsers({ page, perPage });
    if (result.error) throw result.error;

    const users = result.data?.users || [];
    const user = users.find((entry: { email?: string }) => entry.email?.toLowerCase() === email);
    if (user) return user;
    if (users.length < perPage) return null;
    page += 1;
  }

  return null;
}

function authError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function getAuthRedirectOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallback = configured || new URL(request.url).origin;

  try {
    return new URL(fallback).origin;
  } catch {
    return new URL(request.url).origin;
  }
}

function toLoginErrorMessage(message: string) {
  if (/signups not allowed/i.test(message)) return betaAccessMessage;
  return message;
}

function safeNextPath(value?: string) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/app/dashboard";
  return value;
}
