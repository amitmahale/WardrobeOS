import { Buffer } from "node:buffer";
import { expect, type Page, test } from "@playwright/test";

const samplePng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

async function gotoApp(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByTestId("app-shell")).toHaveAttribute("data-hydrated", "true");
}

async function mockServerBackedBootstrap(page: Page) {
  await page.route("**/api/bootstrap", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "test-user", email: "test@example.com" },
        closet: { id: "test-closet", name: "Test Closet" },
        items: []
      })
    });
  });
}

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([
    {
      name: "e2e-auth-bypass",
      value: "1",
      url: "http://127.0.0.1:3000"
    }
  ]);
});

test("login page can request a magic link", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(`test-${Date.now()}@example.com`);
  await page.getByRole("button", { name: /send email code/i }).click();
  await expect(page.getByText(/email code sent|for security purposes|rate limit|invalid/i)).toBeVisible({ timeout: 15_000 });
});

test("dashboard renders from seeded closet", async ({ page }) => {
  await gotoApp(page, "/app/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Active items")).toBeVisible();
});

test("outfit lab renders recommendations", async ({ page }) => {
  await gotoApp(page, "/app/outfits");
  await expect(page.getByRole("heading", { name: "Outfit Lab" })).toBeVisible();
  await expect(page.getByText(/balanced color pairing|strong color pairing/i).first()).toBeVisible();
});

test("buy-next renders purchase candidates", async ({ page }) => {
  await gotoApp(page, "/app/buy-next");
  await expect(page.getByRole("heading", { name: "Buy Next" })).toBeVisible();
  await expect(page.getByText(/unlocks/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Detected closet gaps" })).toBeVisible();
  await expect(page.getByTestId("purchase-card-image").first()).toBeVisible();
});

test("pack planner renders recommended capsule", async ({ page }) => {
  await gotoApp(page, "/app/pack");
  await expect(page.getByRole("heading", { name: "Pack Planner" })).toBeVisible();
  await expect(page.getByText(/recommended capsule/i)).toBeVisible();
});

test("GPT stylist launchpad provides visual try-on prompts", async ({ page }) => {
  await gotoApp(page, "/app/gpt-stylist");
  await expect(page.getByRole("heading", { name: "GPT Stylist" })).toBeVisible();
  await expect(page.getByTestId("gpt-launchpad")).toBeVisible();
  await expect(page.getByText(/visualize those selected closet items on me/i)).toBeVisible();
  await expect(page.getByLabel("Published Custom GPT URL")).toBeVisible();
  await expect(page.getByRole("button", { name: /copy & open/i }).first()).toBeVisible();
});

test("can add a manual item and see it in the closet", async ({ page }) => {
  await gotoApp(page, "/app/items/new");
  await expect(page.locator("#item-camera")).toHaveAttribute("capture", "environment");
  await page.locator("#name").fill("Test Linen Shirt");
  await expect(page.locator("#name")).toHaveValue("Test Linen Shirt");
  await page.locator("#subcategory").fill("linen shirt");
  await expect(page.locator("#subcategory")).toHaveValue("linen shirt");
  await page.locator("#color").selectOption("pink");
  await expect(page.locator("#color")).toHaveValue("pink");
  await page.getByRole("button", { name: /^Save item$/i }).click();
  await expect(page.getByRole("heading", { name: "Test Linen Shirt" })).toBeVisible();

  await gotoApp(page, "/app/closet");
  await expect(page.getByText("Test Linen Shirt")).toBeVisible();
});

test("bulk upload creates reviewable drafts and saves accepted items", async ({ page }) => {
  await gotoApp(page, "/app/items/bulk");
  await expect(page.locator("#bulk-images")).toHaveAttribute("capture", "environment");
  await page.locator("#bulk-images").setInputFiles([
    {
      name: "cream-shirt.png",
      mimeType: "image/png",
      buffer: samplePng
    }
  ]);

  await expect(page.getByText("Review 1 item")).toBeVisible();
  await expect(page.getByText(/batch progress/i)).toBeVisible();
  await expect(page.getByText(/needs review/i).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("Review 1 item")).toBeVisible();
  await page.getByLabel("Item name for cream-shirt.png").fill("Bulk Linen Shirt");
  await page.getByRole("button", { name: /save reviewed items/i }).click();
  await expect(page.getByText("Saved to closet.")).toBeVisible();

  await gotoApp(page, "/app/closet");
  await expect(page.getByText("Bulk Linen Shirt")).toBeVisible();
});

test("single item upload starts AI tagging automatically", async ({ page }) => {
  await mockServerBackedBootstrap(page);
  let tagRequests = 0;
  await page.route("**/api/ai/tag-item", async (route) => {
    tagRequests += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        suggestions: {
          name: "Auto Pink Polo",
          category: "top",
          subcategory: "polo shirt",
          primaryColor: "pink",
          pattern: "solid",
          material: "cotton",
          warmth: 2,
          formality: 2,
          seasons: ["spring", "summer"],
          occasions: ["casual"]
        }
      })
    });
  });

  await gotoApp(page, "/app/items/new");
  await expect(page.getByRole("button", { name: /retry ai tagging/i })).toBeVisible();
  await page.locator("#item-image").setInputFiles([{ name: "pink-polo.png", mimeType: "image/png", buffer: samplePng }]);

  await expect.poll(() => tagRequests).toBe(1);
  await expect(page.getByText("AI tags applied automatically. Review before saving.")).toBeVisible();
  await expect(page.locator("#name")).toHaveValue("Auto Pink Polo");
  await expect(page.locator("#color")).toHaveValue("pink");
});

test("bulk upload starts AI tagging automatically", async ({ page }) => {
  await mockServerBackedBootstrap(page);
  let tagRequests = 0;
  await page.route("**/api/ai/tag-items/bulk", async (route) => {
    tagRequests += 1;
    const payload = route.request().postDataJSON() as { images?: Array<{ id: string }> };
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        results: (payload.images || []).map((image) => ({
          id: image.id,
          suggestions: {
            name: "Auto Bulk Pink Polo",
            category: "top",
            subcategory: "polo shirt",
            primaryColor: "pink",
            pattern: "solid",
            material: "cotton",
            warmth: 2,
            formality: 2,
            seasons: ["spring", "summer"],
            occasions: ["casual"]
          }
        }))
      })
    });
  });

  await gotoApp(page, "/app/items/bulk");
  await page.locator("#bulk-images").setInputFiles([{ name: "auto-pink-polo.png", mimeType: "image/png", buffer: samplePng }]);

  await expect.poll(() => tagRequests).toBe(1);
  await expect(page.getByText("AI tags applied automatically. Review before saving.").first()).toBeVisible();
  await expect(page.getByLabel("Item name for auto-pink-polo.png")).toHaveValue("Auto Bulk Pink Polo");
  await expect(page.locator('select[id$="-color"]').first()).toHaveValue("pink");
});

test("closet filters, season, sort, and list view are interactive", async ({ page }) => {
  await gotoApp(page, "/app/closet");

  await page.locator("#filter-search").fill("Oxford");
  await expect(page.getByText("Navy Oxford Shirt").first()).toBeVisible();

  await page.locator("#filter-season").selectOption("summer");
  await expect(page.getByText("No matching items")).toBeVisible();

  await page.locator("#filter-season").selectOption("all");
  await page.locator("#filter-sort").selectOption("name");
  await expect(page.locator("#filter-sort")).toHaveValue("name");

  await page.locator("#filter-view").selectOption("list");
  await expect(page.locator("#filter-view")).toHaveValue("list");
});

test("dashboard quick wear tracking updates today's wear log", async ({ page }) => {
  await gotoApp(page, "/app/dashboard");
  await page.getByRole("button", { name: /wore today: navy oxford shirt/i }).click();

  await expect(page.getByTestId("recent-wear-log").getByText("Navy Oxford Shirt")).toBeVisible();
  await expect(page.getByText(/1 today/i)).toBeVisible();

  await gotoApp(page, "/app/closet");
  await page.locator("#filter-search").fill("Navy Oxford Shirt");
  await expect(page.getByText(/9 wears/i).first()).toBeVisible();
});
