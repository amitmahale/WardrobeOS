import { OCCASIONS } from "@/lib/constants";
import { getOutfitSuggestions } from "@/lib/domain/outfitGenerator";
import { suggestContextsForItem } from "@/lib/domain/occasionRules";
import type { ItemCategory, Occasion, WardrobeItem } from "@/lib/types";
import { labelize } from "@/lib/utils";

export function getDashboardStats(items: WardrobeItem[]) {
  const activeItems = items.filter((item) => item.status === "active");
  const categoryCount = new Set(activeItems.map((item) => item.category)).size;
  const readyOutfitCount = getOutfitSuggestions(items, {
    occasion: "smart-casual",
    temperatureBand: "mild",
    weather: "dry",
    dressLevel: "smart-casual",
    includeItemIds: [],
    excludeItemIds: [],
    preferLeastWorn: true,
    freshnessBias: 35
  }).filter((recommendation) => recommendation.score >= 74).length;

  return {
    activeCount: activeItems.length,
    categoryCount,
    readyOutfitCount,
    underusedCount: getUnderusedItems(items).length
  };
}

export function getUnderusedItems(items: WardrobeItem[], now = Date.now()) {
  return items
    .filter((item) => item.status === "active")
    .map((item) => {
      const daysSinceLastWorn = item.lastWornAt
        ? Math.floor((now - new Date(item.lastWornAt).getTime()) / 86400000)
        : 999;
      return { ...item, daysSinceLastWorn };
    })
    .filter((item) => item.wearCount <= 1 || item.daysSinceLastWorn > 35)
    .sort((a, b) => a.wearCount - b.wearCount || b.daysSinceLastWorn - a.daysSinceLastWorn);
}

export function getDuplicateClusters(items: WardrobeItem[]) {
  const map = new Map<string, WardrobeItem[]>();
  items
    .filter((item) => item.status === "active")
    .forEach((item) => {
      const key = `${item.category}|${item.primaryColor}`;
      map.set(key, [...(map.get(key) || []), item]);
    });

  return [...map.entries()]
    .map(([key, grouped]) => ({
      key,
      label: `${labelize(grouped[0]?.primaryColor)} ${labelize(grouped[0]?.category)}`,
      count: grouped.length,
      items: grouped
    }))
    .filter((cluster) => cluster.count >= 2)
    .sort((a, b) => b.count - a.count);
}

export function getCategoryComposition(items: WardrobeItem[]) {
  const activeItems = items.filter((item) => item.status === "active");
  const total = Math.max(activeItems.length, 1);
  const counts = activeItems.reduce<Partial<Record<ItemCategory, number>>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([category, count]) => ({
      category: category as ItemCategory,
      count: count ?? 0,
      percent: Math.round(((count ?? 0) / total) * 100)
    }))
    .sort((a, b) => b.count - a.count);
}

export function getOccasionCoverage(items: WardrobeItem[]) {
  return OCCASIONS.map((occasion) => {
    const recs = getOutfitSuggestions(items, {
      occasion,
      temperatureBand: "mild",
      weather: "dry",
      dressLevel: occasion,
      includeItemIds: [],
      excludeItemIds: [],
      preferLeastWorn: false,
      freshnessBias: 20
    });
    const high = recs.filter((recommendation) => recommendation.score >= 72).length;
    const score = Math.min(100, high * 14 + Math.min(recs.length, 5) * 6);
    return { occasion, score };
  });
}

export function buildInsightsPayload(items: WardrobeItem[]) {
  return {
    summary: {
      activeItemCount: items.filter((item) => item.status === "active").length,
      savedOutfitCount: 0,
      underusedItemCount: getUnderusedItems(items).length
    },
    occasionCoverage: getOccasionCoverage(items),
    duplicates: getDuplicateClusters(items).map((cluster) => ({
      clusterKey: cluster.key,
      count: cluster.count,
      itemIds: cluster.items.map((item) => item.id)
    })),
    underusedItems: getUnderusedItems(items).map((item) => ({
      itemId: item.id,
      name: item.name,
      wearCount: item.wearCount,
      suggestedContexts: suggestContextsForItem(item) as Occasion[]
    }))
  };
}
