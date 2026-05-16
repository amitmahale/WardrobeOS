import { Buffer } from "node:buffer";
import { expect, type BrowserContext, type Page, test } from "@playwright/test";

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

async function mockServerPersistence(context: BrowserContext, serverItems: Array<Record<string, unknown>>) {
  await context.route("**/api/upload/item-image", async (route) => {
    const payload = route.request().postDataJSON() as { filename?: string };
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        path: `test-user/items/${payload.filename || "item.png"}`,
        publicUrl: `https://example.com/${payload.filename || "item.png"}`
      })
    });
  });
  await context.route("**/api/items", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    const id = `server-item-${serverItems.length + 1}`;
    const now = new Date().toISOString();
    const item = {
      id,
      ...payload,
      imageData: `https://example.com/${payload.imageName || id}.png`,
      imageName: payload.imageName || `${id}.png`,
      processingStatus: "ready",
      wearCount: 0,
      lastWornAt: null,
      status: "active",
      createdAt: now,
      updatedAt: now
    };
    serverItems.unshift(item);
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ item }) });
  });
  await context.route("**/api/items/*", async (route) => {
    if (route.request().method() !== "PATCH") return route.fallback();
    const id = route.request().url().split("/").at(-1);
    const patch = route.request().postDataJSON() as Record<string, unknown>;
    const index = serverItems.findIndex((item) => item.id === id);
    if (index === -1) {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { message: "Not found" } }) });
      return;
    }
    serverItems[index] = { ...serverItems[index], ...patch, updatedAt: new Date().toISOString() };
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ item: serverItems[index] }) });
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
  await page.route("**/api/auth/send-code", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Email code sent. Enter the code here to sign in inside this app." })
    });
  });

  await page.goto("/login");
  await expect(page.getByTestId("login-page")).toHaveAttribute("data-hydrated", "true");
  const email = `test-${Date.now()}@example.com`;
  await page.locator("#email").fill(email);
  await expect(page.locator("#email")).toHaveValue(email);
  await Promise.all([
    page.waitForResponse("**/api/auth/send-code"),
    page.getByRole("button", { name: /send email code/i }).click()
  ]);
  await expect(page.getByText("Email code sent. Enter the code here to sign in inside this app.")).toBeVisible();
  await expect(page.getByText("fetch failed")).toHaveCount(0);
});

test("dashboard renders from seeded closet", async ({ page }) => {
  await gotoApp(page, "/app/dashboard");
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  await expect(page.getByText("Active items")).toBeVisible();
});

test("outfit lab renders recommendations", async ({ page }) => {
  await gotoApp(page, "/app/outfits");
  await expect(page.getByRole("heading", { name: "Style" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recommended outfits" })).toBeVisible();
  await expect(page.getByTestId("outfit-image-grid").first()).toBeVisible();
  await expect(page.getByText(/balanced color pairing|strong color pairing/i).first()).toBeVisible();
});

test("style actions show visible feedback", async ({ page }) => {
  await gotoApp(page, "/app/outfits");
  await page.getByRole("button", { name: /^Generate outfits$/ }).click();
  await expect(page.getByText(/showing results generated at/i)).toBeVisible();
  await page.getByRole("button", { name: /^Save$/ }).first().click();
  await expect(page.getByText("Outfit saved.")).toBeVisible();
  await page.getByRole("button", { name: /^Wore this$/ }).first().click();
  await expect(page.getByText("Wear log updated.")).toBeVisible();
  await page.getByRole("button", { name: /^Useful$/ }).first().click();
  await expect(page.getByText("Marked useful.")).toBeVisible();
});

test("buy-next renders purchase candidates", async ({ page }) => {
  await gotoApp(page, "/app/buy-next");
  await expect(page.getByRole("heading", { name: "Plan" })).toBeVisible();
  await expect(page.getByText(/unlocks/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Detected closet gaps" })).toBeVisible();
  await expect(page.getByTestId("purchase-card-image").first()).toBeVisible();
});

test("plan actions show visible feedback", async ({ page }) => {
  await gotoApp(page, "/app/buy-next");
  await page.getByRole("button", { name: /^Run buy-next analysis$/ }).click();
  await expect(page.getByText(/showing purchase analysis from/i)).toBeVisible();
  await page.getByRole("button", { name: /^Save candidate$/ }).first().click();
  await expect(page.getByText("Candidate saved.")).toBeVisible();
  await page.getByRole("button", { name: /^Dismiss$/ }).first().click();
  await expect(page.getByText("Candidate dismissed.")).toBeVisible();
});

test("pack planner renders recommended capsule", async ({ page }) => {
  await gotoApp(page, "/app/pack");
  await expect(page.getByRole("heading", { name: "Pack Planner" })).toBeVisible();
  await expect(page.getByText(/recommended capsule/i)).toBeVisible();
});

test("pack planner build button shows visible feedback", async ({ page }) => {
  await gotoApp(page, "/app/pack");
  await page.getByRole("button", { name: /^Build packing plan$/ }).click();
  await expect(page.getByText(/showing packing plan built at/i)).toBeVisible();
});

test("GPT stylist launchpad provides visual try-on prompts", async ({ page }) => {
  await gotoApp(page, "/app/gpt-stylist");
  await expect(page.getByRole("heading", { name: "GPT Stylist" })).toBeVisible();
  await expect(page.getByTestId("gpt-launchpad")).toBeVisible();
  await expect(page.getByText(/visualize those selected closet items on me/i)).toBeVisible();
  await expect(page.getByLabel("Published Custom GPT URL")).toBeVisible();
  await expect(page.getByRole("button", { name: /copy & open/i }).first()).toBeVisible();
});

test("saved visualizations page renders the GPT save workflow", async ({ page }) => {
  await gotoApp(page, "/app/visualizations");
  await expect(page.getByRole("heading", { name: "Visualizations", exact: true })).toBeVisible();
  await expect(page.getByText(/save this visualization to wardrobeos/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /refresh \(sign in required\)/i })).toBeDisabled();
  await expect(page.getByRole("link", { name: /start in gpt stylist/i })).toBeVisible();
});

test("reliability page shows diagnostics and upload recovery actions", async ({ page }) => {
  const uploads = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      itemId: null,
      uploadId: "upl-test",
      filename: "interrupted-shirt.png",
      storagePath: "test-user/items/interrupted-shirt.png",
      publicUrl: "https://example.com/interrupted-shirt.png",
      status: "failed",
      stage: "item_create_failed",
      errorMessage: "Item save failed.",
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  await page.route("**/api/trust/diagnostics", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        diagnostics: {
          user: { id: "test-user", email: "test@example.com" },
          closet: { id: "test-closet", name: "Test Closet" },
          deployment: "test",
          itemCount: 12,
          imageCount: 12,
          unresolvedUploadCount: uploads.filter((upload) => upload.status === "failed" || upload.status === "pending").length,
          recentEvents: [
            {
              id: "event-1",
              eventType: "upload.failed",
              severity: "error",
              route: "/app/items/new",
              itemId: null,
              uploadId: "upl-test",
              message: "Item save failed.",
              metadata: {},
              createdAt: new Date().toISOString()
            }
          ],
          uploads
        }
      })
    });
  });
  await page.route("**/api/trust/uploads/*/recover", async (route) => {
    uploads[0] = { ...uploads[0], status: "recovered", stage: "recovered" };
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ upload: uploads[0] }) });
  });

  await gotoApp(page, "/app/reliability");
  await expect(page.getByRole("heading", { name: "Reliability", exact: true })).toBeVisible();
  await expect(page.getByText("interrupted-shirt.png")).toBeVisible();
  await page.getByRole("button", { name: /^Recover$/ }).click();
  await expect(page.getByText("interrupted-shirt.png recovered to your closet.")).toBeVisible();
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
  await mockServerPersistence(page.context(), []);
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

test("signed-in single item upload autosaves to the server and survives local data loss", async ({ page, context }) => {
  const serverItems: Array<Record<string, unknown>> = [];
  await context.route("**/api/bootstrap", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "test-user", email: "test@example.com" },
        closet: { id: "test-closet", name: "Test Closet" },
        items: serverItems
      })
    });
  });
  await mockServerPersistence(context, serverItems);
  await context.route("**/api/ai/tag-item", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ suggestions: {} }) });
  });

  await gotoApp(page, "/app/items/new");
  await page.locator("#item-image").setInputFiles([{ name: "single-jacket.png", mimeType: "image/png", buffer: samplePng }]);

  await expect.poll(() => serverItems.length).toBe(1);
  await page.locator("#name").fill("Autosaved Single Jacket");
  await expect.poll(() => serverItems[0]?.name).toBe("Autosaved Single Jacket");
  await expect(page.getByText(/autosaved to your closet|ai tags saved to your closet/i).first()).toBeVisible();

  await page.evaluate(() => window.localStorage.clear());
  await page.close();
  const reopened = await context.newPage();
  await gotoApp(reopened, "/app/closet");
  await expect(reopened.getByText("Autosaved Single Jacket")).toBeVisible();
});

test("single item upload records a recoverable failure when item creation fails after image upload", async ({ page, context }) => {
  const trustRecords: Array<Record<string, unknown>> = [];
  await context.route("**/api/bootstrap", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "test-user", email: "test@example.com" },
        closet: { id: "test-closet", name: "Test Closet" },
        items: []
      })
    });
  });
  await context.route("**/api/upload/item-image", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        path: "test-user/items/recoverable-shirt.png",
        publicUrl: "https://example.com/recoverable-shirt.png"
      })
    });
  });
  await context.route("**/api/items", async (route) => {
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { message: "failed" } }) });
  });
  await context.route("**/api/trust/uploads", async (route) => {
    trustRecords.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ upload: { id: "trust-1" } }) });
  });
  await context.route("**/api/ai/tag-item", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ suggestions: {} }) });
  });

  await gotoApp(page, "/app/items/new");
  await page.locator("#item-image").setInputFiles([{ name: "recoverable-shirt.png", mimeType: "image/png", buffer: samplePng }]);

  await expect(page.getByText(/autosave failed/i)).toBeVisible();
  await expect.poll(() => trustRecords.some((record) => record.status === "failed" && record.stage === "item_create_failed")).toBe(true);
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

test("signed-in bulk uploads autosave to the server and survive local data loss", async ({ page, context }) => {
  const serverItems: Array<Record<string, unknown>> = [];
  await context.route("**/api/bootstrap", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "test-user", email: "test@example.com" },
        closet: { id: "test-closet", name: "Test Closet" },
        items: serverItems
      })
    });
  });
  await context.route("**/api/upload/item-image", async (route) => {
    const payload = route.request().postDataJSON() as { filename?: string };
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        path: `test-user/items/${payload.filename || "item.png"}`,
        publicUrl: `https://example.com/${payload.filename || "item.png"}`
      })
    });
  });
  await context.route("**/api/items", async (route) => {
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    const id = `server-item-${serverItems.length + 1}`;
    const now = new Date().toISOString();
    const item = {
      id,
      ...payload,
      imageData: `https://example.com/${payload.imageName || id}.png`,
      imageName: payload.imageName || `${id}.png`,
      processingStatus: "ready",
      wearCount: 0,
      lastWornAt: null,
      status: "active",
      createdAt: now,
      updatedAt: now
    };
    serverItems.unshift(item);
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ item }) });
  });
  await context.route("**/api/items/*", async (route) => {
    if (route.request().method() !== "PATCH") return route.fallback();
    const id = route.request().url().split("/").at(-1);
    const patch = route.request().postDataJSON() as Record<string, unknown>;
    const index = serverItems.findIndex((item) => item.id === id);
    if (index === -1) {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { message: "Not found" } }) });
      return;
    }
    serverItems[index] = { ...serverItems[index], ...patch, updatedAt: new Date().toISOString() };
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ item: serverItems[index] }) });
  });
  await context.route("**/api/ai/tag-items/bulk", async (route) => {
    const payload = route.request().postDataJSON() as { images?: Array<{ id: string; filename?: string }> };
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        results: (payload.images || []).map((image, index) => ({
          id: image.id,
          suggestions: {
            name: index === 0 ? "Autosaved Navy Pants" : "Autosaved Cream Shirt",
            category: index === 0 ? "bottom" : "top",
            subcategory: index === 0 ? "pants" : "shirt",
            primaryColor: index === 0 ? "navy" : "cream",
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
  await page.locator("#bulk-images").setInputFiles([
    { name: "cream-shirt.png", mimeType: "image/png", buffer: samplePng },
    { name: "navy-pants.png", mimeType: "image/png", buffer: samplePng }
  ]);

  await expect.poll(() => serverItems.length).toBe(2);
  await expect
    .poll(() => serverItems.map((item) => item.name).sort().join("|"))
    .toBe("Autosaved Cream Shirt|Autosaved Navy Pants");

  await page.evaluate(() => window.localStorage.clear());
  await page.close();
  const reopened = await context.newPage();
  await gotoApp(reopened, "/app/closet");
  await expect(reopened.getByText("Autosaved Cream Shirt")).toBeVisible();
  await expect(reopened.getByText("Autosaved Navy Pants")).toBeVisible();
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
