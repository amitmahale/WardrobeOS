import { afterEach, describe, expect, it } from "vitest";
import { buildAccessToken, isAllowedRedirectUri, validatePkce, verifyAccessToken } from "@/lib/gpt/oauth";
import { createHash } from "node:crypto";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("GPT OAuth helpers", () => {
  it("signs and verifies WardrobeOS access tokens", () => {
    process.env.GPT_ACTION_CLIENT_SECRET = "test-client-secret";
    process.env.GPT_ACTION_TOKEN_SECRET = "test-token-secret-with-enough-entropy";

    const token = buildAccessToken("user_123", ["closet:read", "outfits:suggest"]);
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe("user_123");
    expect(payload.scope).toBe("closet:read outfits:suggest");
    expect(payload.aud).toBe("chatgpt-actions");
  });

  it("rejects tampered access tokens", () => {
    process.env.GPT_ACTION_CLIENT_SECRET = "test-client-secret";
    process.env.GPT_ACTION_TOKEN_SECRET = "test-token-secret-with-enough-entropy";

    const token = buildAccessToken("user_123", ["closet:read"]);
    const tampered = `${token.slice(0, -2)}xx`;

    expect(() => verifyAccessToken(tampered)).toThrow(/signature/i);
  });

  it("allows ChatGPT redirect origins but blocks unrelated redirects", () => {
    expect(isAllowedRedirectUri("https://chatgpt.com/aip/example/oauth/callback")).toBe(true);
    expect(isAllowedRedirectUri("https://chat.openai.com/aip/example/oauth/callback")).toBe(true);
    expect(isAllowedRedirectUri("https://example.com/oauth/callback")).toBe(false);
  });

  it("validates S256 PKCE challenges", () => {
    const verifier = "verifier-value";
    const challenge = createHash("sha256").update(verifier).digest("base64url");

    expect(validatePkce(challenge, "S256", verifier)).toBe(true);
    expect(validatePkce(challenge, "S256", "wrong")).toBe(false);
  });
});
