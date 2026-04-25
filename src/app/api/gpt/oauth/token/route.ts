import { NextResponse } from "next/server";
import {
  buildAccessToken,
  createRefreshToken,
  GptConfigError,
  gptOAuthError,
  hashToken,
  readClientCredentials,
  refreshTokenExpiry,
  validateClientCredentials,
  validatePkce
} from "@/lib/gpt/oauth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await readTokenBody(request);
  const grantType = body.get("grant_type");
  const { clientId, clientSecret } = readClientCredentials(request, body);

  try {
    validateClientCredentials(clientId, clientSecret, request);
  } catch (error) {
    if (error instanceof GptConfigError) {
      return gptOAuthError("server_error", error.message, 503);
    }
    return gptOAuthError("invalid_client", error instanceof Error ? error.message : "Invalid OAuth client.", 401);
  }

  if (grantType === "authorization_code") {
    return exchangeAuthorizationCode(request, body, clientId);
  }
  if (grantType === "refresh_token") {
    return refreshAccessToken(request, body, clientId);
  }

  return gptOAuthError("unsupported_grant_type", "Use authorization_code or refresh_token.");
}

async function exchangeAuthorizationCode(request: Request, body: URLSearchParams, clientId: string) {
  const code = body.get("code");
  const redirectUri = body.get("redirect_uri");
  if (!code || !redirectUri) return gptOAuthError("invalid_request", "Missing code or redirect_uri.");

  const db = createSupabaseServiceRoleClient() as any;
  const codeResult = await db
    .from("gpt_oauth_codes")
    .select("id, user_id, client_id, redirect_uri, scopes, expires_at, consumed_at, code_challenge, code_challenge_method")
    .eq("code_hash", hashToken(code))
    .maybeSingle();
  if (codeResult.error) return gptOAuthError("server_error", codeResult.error.message, 500);

  const grant = codeResult.data;
  if (!grant || grant.consumed_at || Date.parse(grant.expires_at) <= Date.now()) {
    return gptOAuthError("invalid_grant", "Authorization code is invalid or expired.");
  }
  if (grant.client_id !== clientId || grant.redirect_uri !== redirectUri) {
    return gptOAuthError("invalid_grant", "Authorization code does not match this OAuth client.");
  }
  if (!validatePkce(grant.code_challenge, grant.code_challenge_method, body.get("code_verifier"))) {
    return gptOAuthError("invalid_grant", "PKCE verification failed.");
  }

  const consumed = await db.from("gpt_oauth_codes").update({ consumed_at: new Date().toISOString() }).eq("id", grant.id);
  if (consumed.error) return gptOAuthError("server_error", consumed.error.message, 500);

  const refreshToken = createRefreshToken();
  const inserted = await db.from("gpt_oauth_refresh_tokens").insert({
    refresh_token_hash: hashToken(refreshToken),
    user_id: grant.user_id,
    client_id: clientId,
    scopes: grant.scopes || [],
    expires_at: refreshTokenExpiry()
  });
  if (inserted.error) return gptOAuthError("server_error", inserted.error.message, 500);

  return tokenResponse(buildAccessToken(grant.user_id, grant.scopes || [], request), refreshToken, grant.scopes || []);
}

async function refreshAccessToken(request: Request, body: URLSearchParams, clientId: string) {
  const refreshToken = body.get("refresh_token");
  if (!refreshToken) return gptOAuthError("invalid_request", "Missing refresh_token.");

  const db = createSupabaseServiceRoleClient() as any;
  const current = await db
    .from("gpt_oauth_refresh_tokens")
    .select("id, user_id, client_id, scopes, expires_at, revoked_at")
    .eq("refresh_token_hash", hashToken(refreshToken))
    .maybeSingle();
  if (current.error) return gptOAuthError("server_error", current.error.message, 500);

  const grant = current.data;
  if (!grant || grant.revoked_at || Date.parse(grant.expires_at) <= Date.now()) {
    return gptOAuthError("invalid_grant", "Refresh token is invalid or expired.");
  }
  if (grant.client_id !== clientId) {
    return gptOAuthError("invalid_grant", "Refresh token does not match this OAuth client.");
  }

  const nextRefreshToken = createRefreshToken();
  const now = new Date().toISOString();
  const revoked = await db.from("gpt_oauth_refresh_tokens").update({ revoked_at: now, last_used_at: now }).eq("id", grant.id);
  if (revoked.error) return gptOAuthError("server_error", revoked.error.message, 500);

  const inserted = await db.from("gpt_oauth_refresh_tokens").insert({
    refresh_token_hash: hashToken(nextRefreshToken),
    user_id: grant.user_id,
    client_id: clientId,
    scopes: grant.scopes || [],
    expires_at: refreshTokenExpiry()
  });
  if (inserted.error) return gptOAuthError("server_error", inserted.error.message, 500);

  return tokenResponse(buildAccessToken(grant.user_id, grant.scopes || [], request), nextRefreshToken, grant.scopes || []);
}

function tokenResponse(accessToken: string, refreshToken: string, scopes: string[]) {
  return NextResponse.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: scopes.join(" ")
  });
}

async function readTokenBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, string | undefined>;
    return new URLSearchParams(Object.entries(json).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  }
  return new URLSearchParams(await request.text());
}
