"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Mail } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/field";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthActionState = { message?: string; error?: string };
type SendCodeResponse = { message?: string; error?: { message?: string } };
const MIN_OTP_LENGTH = 6;
const MAX_OTP_LENGTH = 8;

export default function LoginPage() {
  const [state, setState] = useState<AuthActionState>({});
  const [pending, setPending] = useState(false);
  const [verifyState, setVerifyState] = useState<AuthActionState>({});
  const [verifying, setVerifying] = useState(false);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [authError, setAuthError] = useState("");
  const [nextPath, setNextPath] = useState("/app/dashboard");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAuthError(params.get("auth_error") || "");
    setNextPath(safeNextPath(params.get("next")));
    setIsHydrated(true);
  }, []);

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setState({ error: "Email is required." });
      return;
    }

    setPending(true);
    setState({});
    setVerifyState({});
    const response = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, next: nextPath })
    });
    const payload = (await response.json()) as SendCodeResponse;

    if (!response.ok) {
      setState({ error: payload.error?.message || "Could not send email code." });
    } else {
      setState({ message: payload.message || "Email code sent. Enter the code here to sign in inside this app." });
    }
    setPending(false);
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedToken = token.replace(/\D/g, "");
    if (!normalizedEmail) {
      setVerifyState({ error: "Email is required." });
      return;
    }
    if (!isValidOtpLength(normalizedToken)) {
      setVerifyState({ error: `Enter the ${MIN_OTP_LENGTH}-${MAX_OTP_LENGTH} digit code from your email.` });
      return;
    }

    setVerifying(true);
    setVerifyState({});
    const supabase = createSupabaseBrowserClient();
    const otpTypes: EmailOtpType[] = ["email", "magiclink", "signup"];
    let lastError = "Code is invalid or expired.";

    for (const type of otpTypes) {
      const { error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token: normalizedToken, type });
      if (!error) {
        window.location.assign(nextPath);
        return;
      }
      lastError = error.message;
    }

    setVerifyState({
      error: `${lastError} Request a fresh code and make sure the email template contains only {{ .Token }}, not {{ .ConfirmationURL }}.`
    });
    setVerifying(false);
  }

  return (
    <main className="grid min-h-screen place-items-center px-5" data-testid="login-page" data-hydrated={isHydrated}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 grid size-12 place-items-center rounded-2xl border border-brand/25 bg-brand/10 text-brand">
            <Mail className="size-5" />
          </div>
          <CardTitle>Sign in to Wardrobe OS</CardTitle>
          <CardDescription>
            Send an email code, then enter it here. This keeps iPhone PWA login inside the installed app.
          </CardDescription>
          {authError ? (
            <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {authError}
            </p>
          ) : null}
        </CardHeader>
        <form onSubmit={sendCode} className="grid gap-4">
          <Field>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          {state?.error ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          {state?.message ? (
            <p className="rounded-2xl border border-brand/30 bg-brand/10 p-3 text-sm text-brand">{state.message}</p>
          ) : null}
          <Button disabled={pending}>{pending ? "Sending..." : "Send email code"}</Button>
          <Button asChild variant="ghost">
            <Link href="/">Back to home</Link>
          </Button>
        </form>

        <div className="my-6 h-px bg-white/10" />

        <form onSubmit={verifyCode} className="grid gap-4">
          <Field>
            <Label htmlFor="token">Email code</Label>
            <Input
              id="token"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={MAX_OTP_LENGTH}
              placeholder="12345678"
              value={token}
              onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, MAX_OTP_LENGTH))}
            />
          </Field>
          {verifyState?.error ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {verifyState.error}
            </p>
          ) : null}
          <Button disabled={verifying} variant="secondary">
            <KeyRound className="mr-2 size-4" />
            {verifying ? "Verifying..." : "Verify code in this app"}
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            Do not click the email link if your template still includes one. Some email clients pre-open links and invalidate
            the code. The safest flow is code only.
          </p>
        </form>
      </Card>
    </main>
  );
}

function isValidOtpLength(value: string) {
  return value.length >= MIN_OTP_LENGTH && value.length <= MAX_OTP_LENGTH;
}

function safeNextPath(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/app/dashboard";
  return value;
}
