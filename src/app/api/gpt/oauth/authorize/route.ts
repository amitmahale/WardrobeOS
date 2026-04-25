import { NextResponse } from "next/server";
import { createSupabaseSsrClient } from "@/lib/supabase/ssr";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ensureDefaultCloset } from "@/lib/supabase/wardrobe-repository";
import {
  appendOAuthParams,
  createAuthorizationCode,
  getGptOAuthConfig,
  hashToken,
  isAllowedRedirectUri,
  normalizeScopes,
  oauthExpiry,
  requireGptOAuthSecrets
} from "@/lib/gpt/oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const responseType = url.searchParams.get("response_type");
  const clientId = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const state = url.searchParams.get("state") || undefined;
  const scope = url.searchParams.get("scope");
  const codeChallenge = url.searchParams.get("code_challenge");
  const codeChallengeMethod = url.searchParams.get("code_challenge_method");
  const config = getGptOAuthConfig(request);
  try {
    requireGptOAuthSecrets(request);
  } catch (error) {
    return NextResponse.json(
      { error: "server_error", error_description: error instanceof Error ? error.message : "Custom GPT OAuth is not configured." },
      { status: 503 }
    );
  }

  if (responseType !== "code") {
    return NextResponse.json({ error: "unsupported_response_type", error_description: "Use response_type=code." }, { status: 400 });
  }
  if (clientId !== config.clientId) {
    return NextResponse.json({ error: "invalid_client", error_description: "Unknown OAuth client." }, { status: 400 });
  }
  if (!redirectUri || !isAllowedRedirectUri(redirectUri, request)) {
    return NextResponse.json({ error: "invalid_redirect_uri", error_description: "Redirect URI is not allowed." }, { status: 400 });
  }
  if (codeChallengeMethod && !["plain", "S256"].includes(codeChallengeMethod)) {
    return NextResponse.json({ error: "invalid_request", error_description: "Unsupported PKCE challenge method." }, { status: 400 });
  }

  const supabase = await createSupabaseSsrClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("next", `${url.pathname}${url.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const db = createSupabaseServiceRoleClient() as any;
  await ensureDefaultCloset(db, data.user.id, data.user.email);

  const code = createAuthorizationCode();
  const insert = await db.from("gpt_oauth_codes").insert({
    code_hash: hashToken(code),
    user_id: data.user.id,
    client_id: clientId,
    redirect_uri: redirectUri,
    scopes: normalizeScopes(scope),
    code_challenge: codeChallenge || null,
    code_challenge_method: codeChallengeMethod || null,
    expires_at: oauthExpiry()
  });
  if (insert.error) {
    return NextResponse.json({ error: "server_error", error_description: insert.error.message }, { status: 500 });
  }

  return NextResponse.redirect(appendOAuthParams(redirectUri, { code, state }));
}
