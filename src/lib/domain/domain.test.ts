import { describe, expect, it } from "vitest";
import { defaultBuyNextQuery, defaultOutfitQuery, defaultPackQuery, createSeedItems } from "@/lib/demoData";
import { getDuplicateClusters, getOccasionCoverage, getUnderusedItems } from "@/lib/domain/insights";
import { getOutfitSuggestions } from "@/lib/domain/outfitGenerator";
import { getPackPlan } from "@/lib/domain/packingPlanner";
import { getPurchaseSuggestions } from "@/lib/domain/purchaseSimulator";
import { getRecentWearEvents, getTodaysWearCount, getWearActivity } from "@/lib/domain/wearTracking";

describe("wardrobe domain engine", () => {
  it("generates valid seeded outfits with non-empty rationales", () => {
    const results = getOutfitSuggestions(createSeedItems(), defaultOutfitQuery);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.rationale.length).toBeGreaterThan(10);
    expect(results[0]?.items.some((item) => item.category === "top")).toBe(true);
    expect(results[0]?.items.some((item) => item.category === "bottom")).toBe(true);
  });

  it("keeps buy-next recommendations deterministic for the same query", () => {
    const items = createSeedItems();
    const first = getPurchaseSuggestions(items, defaultBuyNextQuery).map((recommendation) => recommendation.key);
    const second = getPurchaseSuggestions(items, defaultBuyNextQuery).map((recommendation) => recommendation.key);
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
  });

  it("respects the packing shoe limit", () => {
    const plan = getPackPlan(createSeedItems(), { ...defaultPackQuery, shoeLimit: 1 });
    expect(plan.counts.shoes).toBeLessThanOrEqual(1);
    expect(plan.outfitCount).toBeGreaterThan(0);
  });

  it("calculates insight signals from seed data", () => {
    const items = createSeedItems();
    expect(getUnderusedItems(items).length).toBeGreaterThan(0);
    expect(getOccasionCoverage(items).find((row) => row.occasion === "work")?.score).toBeGreaterThan(0);
    expect(getDuplicateClusters(items).length).toBeGreaterThan(0);
  });

  it("summarizes wear logs into recent events and daily activity", () => {
    const items = createSeedItems();
    const wornAt = "2026-04-25T12:00:00.000Z";
    const wearLog = [
      {
        id: "wear_test",
        itemIds: [items[0].id, items[1].id],
        source: "outfit" as const,
        outfitName: "Test outfit",
        wornAt,
        createdAt: wornAt
      }
    ];

    expect(getRecentWearEvents(wearLog, items, 1)[0]?.label).toBe("Test outfit");
    expect(getTodaysWearCount(wearLog, new Date(wornAt))).toBe(2);
    expect(getWearActivity(wearLog, items, 3, new Date(wornAt)).at(-1)?.count).toBe(2);
  });
});
