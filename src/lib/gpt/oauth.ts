import { createHash, randomBytes, timingSafeEqual, createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { zodError } from "@/lib/validation/schemas";

export type GptTokenPayload = {
  iss: "wardrobeos";
  aud: "chatgpt-actions";
  sub: string;
  scope: string;
  iat: number;
  exp: number;
};

export type GptAuthContext = {
  userId: string;
  scopes: string[];
};

export const GPT_DEFAULT_SCOPES = [
  "closet:read",
  "outfits:read",
  "outfits:suggest",
  "visualizations:read",
  "visualizations:write"
] as const;

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const CODE_TTL_SECONDS = 10 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

export function getGptOAuthConfig(request?: Request) {
  const clientId = process.env.GPT_ACTION_CLIENT_ID || "wardrobeos-custom-gpt";
  const clientSecret = process.env.GPT_ACTION_CLIENT_SECRET?.trim();
  const tokenSecret = process.env.GPT_ACTION_TOKEN_SECRET?.trim();
  const siteOrigin = getSiteOrigin(request);

  return {
    clientId,
    clientSecret,
    tokenSecret,
    siteOrigin,
    allowedRedirectUris: splitEnvList(process.env.GPT_ACTION_ALLOWED_REDIRECT_URIS),
    allowedRedirectOrigins: splitEnvList(process.env.GPT_ACTION_ALLOWED_REDIRECT_ORIGINS, [
      "https://chat.openai.com",
      "https://chatgpt.com"
    ])
  };
}

export function requireGptOAuthSecrets(request?: Request) {
  const config = getGptOAuthConfig(request);
  if (!config.clientSecret || !config.tokenSecret) {
    throw new GptConfigError(
      "Custom GPT OAuth is not configured. Set GPT_ACTION_CLIENT_SECRET and GPT_ACTION_TOKEN_SECRET."
    );
  }
  return config as ReturnType<typeof getGptOAuthConfig> & { clientSecret: string; tokenSecret: string };
}

export class GptConfigError extends Error {
  status = 503;
}

export class GptAuthError extends Error {
  status = 401;
}

export class GptForbiddenError extends Error {
  status = 403;
}

export function gptJsonError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(zodError(error), { status: 400 });
  }
  if (error instanceof GptConfigError || error instanceof GptAuthError || error instanceof GptForbiddenError) {
    return NextResponse.json({ error: { code: error.name || "gpt_error", message: error.message } }, { status: error.status });
  }
  return NextResponse.json(
    { error: { code: "server_error", message: error instanceof Error ? error.message : "Unexpected error" } },
    { status: 500 }
  );
}

export function gptOAuthError(error: string, description: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status });
}

export function normalizeScopes(value: string | null | undefined) {
  const requested = new Set((value || GPT_DEFAULT_SCOPES.join(" ")).split(/\s+/).filter(Boolean));
  const allowed = new Set<string>(GPT_DEFAULT_SCOPES);
  return [...requested].filter((scope) => allowed.has(scope));
}

export function hasScope(auth: GptAuthContext, scope: string) {
  if (!auth.scopes.includes(scope)) throw new GptForbiddenError(`Missing required scope: ${scope}`);
}

export function createAuthorizationCode() {
  return randomBytes(32).toString("base64url");
}

export function createRefreshToken() {
  return `wos_refresh_${randomBytes(36).toString("base64url")}`;
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function oauthExpiry(seconds = CODE_TTL_SECONDS) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function refreshTokenExpiry() {
  return oauthExpiry(REFRESH_TOKEN_TTL_SECONDS);
}

export function appendOAuthParams(redirectUri: string, params: Record<string, string | undefined>) {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url;
}

export function isAllowedRedirectUri(redirectUri: string, request?: Request) {
  const config = getGptOAuthConfig(request);
  let url: URL;
  try {
    url = new URL(redirectUri);
  } catch {
    return false;
  }

  if (config.allowedRedirectUris.includes(url.toString())) return true;
  return config.allowedRedirectOrigins.includes(url.origin);
}

export function getRequestOrigin(request: Request) {
  return new URL(request.url).origin;
}

export function getSiteOrigin(request?: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fall through to request origin.
    }
  }
  return request ? getRequestOrigin(request) : "http://localhost:3000";
}

export function buildAccessToken(userId: string, scopes: string[], request?: Request) {
  const { tokenSecret } = requireGptOAuthSecrets(request);
  const now = Math.floor(Date.now() / 1000);
  const payload: GptTokenPayload = {
    iss: "wardrobeos",
    aud: "chatgpt-actions",
    sub: userId,
    scope: scopes.join(" "),
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS
  };
  return signJwt(payload, tokenSecret);
}

export function verifyAccessToken(token: string, request?: Request): GptTokenPayload {
  const { tokenSecret } = requireGptOAuthSecrets(request);
  const [encodedHeader, encodedPayload, signature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !signature) throw new GptAuthError("Invalid access token.");

  const expected = hmac(`${encodedHeader}.${encodedPayload}`, tokenSecret);
  if (!safeEquals(signature, expected)) throw new GptAuthError("Invalid access token signature.");

  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as GptTokenPayload;
  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== "wardrobeos" || payload.aud !== "chatgpt-actions" || !payload.sub) {
    throw new GptAuthError("Invalid access token claims.");
  }
  if (payload.exp <= now) throw new GptAuthError("Access token expired.");
  return payload;
}

export async function authenticateGptRequest(request: Request): Promise<GptAuthContext> {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new GptAuthError("Missing bearer token.");

  const payload = verifyAccessToken(match[1], request);
  await markGptTokenUsed(payload.sub);
  return {
    userId: payload.sub,
    scopes: payload.scope.split(/\s+/).filter(Boolean)
  };
}

async function markGptTokenUsed(userId: string) {
  try {
    const db = createSupabaseServiceRoleClient() as any;
    const now = new Date().toISOString();
    await db
      .from("gpt_oauth_refresh_tokens")
      .update({ last_used_at: now })
      .eq("user_id", userId)
      .is("revoked_at", null)
      .gt("expires_at", now);
  } catch {
    // Usage telemetry should never block the GPT action response.
  }
}

export function readClientCredentials(request: Request, body: URLSearchParams) {
  const auth = request.headers.get("authorization") || "";
  const basic = auth.match(/^Basic\s+(.+)$/i);
  if (basic) {
    const decoded = Buffer.from(basic[1], "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator !== -1) {
      return {
        clientId: decoded.slice(0, separator),
        clientSecret: decoded.slice(separator + 1)
      };
    }
  }

  return {
    clientId: body.get("client_id") || "",
    clientSecret: body.get("client_secret") || ""
  };
}

export function validateClientCredentials(clientId: string, clientSecret: string, request?: Request) {
  const config = requireGptOAuthSecrets(request);
  if (clientId !== config.clientId || !safeEquals(clientSecret, config.clientSecret)) {
    throw new GptAuthError("Invalid OAuth client credentials.");
  }
  return config;
}

export function validatePkce(codeChallenge: string | null, method: string | null, verifier: string | null) {
  if (!codeChallenge) return true;
  if (!verifier) return false;
  if (!method || method === "plain") return safeEquals(verifier, codeChallenge);
  if (method === "S256") return safeEquals(base64UrlEncode(createHash("sha256").update(verifier).digest()), codeChallenge);
  return false;
}

export async function revokeExpiredGptTokens() {
  const db = createSupabaseServiceRoleClient() as any;
  const now = new Date().toISOString();
  await db.from("gpt_oauth_codes").update({ consumed_at: now }).lt("expires_at", now).is("consumed_at", null);
  await db.from("gpt_oauth_refresh_tokens").update({ revoked_at: now }).lt("expires_at", now).is("revoked_at", null);
}

function signJwt(payload: GptTokenPayload, secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const signature = hmac(`${encodedHeader}.${encodedPayload}`, secret);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function hmac(value: string, secret: string) {
  return base64UrlEncode(createHmac("sha256", secret).update(value).digest());
}

function base64UrlEncode(value: Buffer) {
  return value.toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url");
}

function safeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function splitEnvList(value: string | undefined, fallback: string[] = []) {
  const parsed = (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return parsed.length ? parsed : fallback;
}
