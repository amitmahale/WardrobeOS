import { expect, test } from "@playwright/test";

test("public landing and PWA manifest are available", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /wear more of what you own/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /open the app/i })).toBeVisible();

  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  expect(await manifest.json()).toMatchObject({
    name: "Wardrobe OS",
    display: "standalone"
  });
});

test("protected app redirects anonymous users to magic-link login", async ({ page }) => {
  await page.goto("/app/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /sign in to wardrobe os/i })).toBeVisible();
});

test("login exposes an in-app email code fallback for PWA users", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel(/email code/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /verify code in this app/i })).toBeEnabled();
  await expect(page.getByText(/password fallback/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /sign in with password/i })).toHaveCount(0);

  await page.locator("#email").fill("pwa@example.com");
  await expect(page.locator("#email")).toHaveValue("pwa@example.com");
  await expect(page.getByRole("button", { name: /verify code in this app/i })).toBeEnabled();
});

test("Custom GPT OpenAPI schema is publicly available", async ({ request }) => {
  const response = await request.get("/api/gpt/openapi.json");
  expect(response.ok()).toBeTruthy();
  const schema = await response.json();

  expect(schema.openapi).toBe("3.1.0");
  expect(schema.paths["/api/gpt/closet"].get.operationId).toBe("listClosetItems");
  expect(schema.paths["/api/gpt/visualizations"].post.operationId).toBe("saveChatGptVisualization");
  expect(schema.paths["/api/gpt/visualizations"].post["x-openai-isConsequential"]).toBe(true);
  expect(schema.components.securitySchemes.OAuth2.flows.authorizationCode.authorizationUrl).toContain(
    "/api/gpt/oauth/authorize"
  );
});

test("expired auth links are explained on the login screen", async ({ page }) => {
  await page.goto("/?error_description=Token%20has%20expired%20or%20is%20invalid");
  await expect(page).toHaveURL(/\/login\?auth_error=/);
  await expect(page.getByText(/token has expired or is invalid/i)).toBeVisible();
  await expect(page.getByText(/enter it here/i)).toBeVisible();
});
