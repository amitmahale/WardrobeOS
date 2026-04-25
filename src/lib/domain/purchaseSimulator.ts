import { PURCHASE_CANDIDATES } from "@/lib/constants";
import { getOutfitSuggestions, outfitKey } from "@/lib/domain/outfitGenerator";
import { createPlaceholderImage } from "@/lib/domain/placeholderImage";
import type {
  BuyNextQuery,
  PurchaseCandidate,
  PurchaseRecommendation,
  Season,
  WardrobeItem
} from "@/lib/types";

export function getPurchaseSuggestions(items: WardrobeItem[], query: BuyNextQuery): PurchaseRecommendation[] {
  const targetOccasion = query.targetOccasion || "smart-casual";
  const temperatureBand = seasonToTemperature(query.season);
  const baseOutfits = getOutfitSuggestions(items, {
    occasion: targetOccasion,
    temperatureBand,
    weather: "dry",
    dressLevel: targetOccasion,
    includeItemIds: [],
    excludeItemIds: [],
    preferLeastWorn: false,
    freshnessBias: 20
  });
  const baseKeys = new Set(baseOutfits.map((outfit) => outfit.key));

  return PURCHASE_CANDIDATES.filter(
    (candidate) => query.preferredCategory === "all" || candidate.category === query.preferredCategory
  )
    .filter((candidate) => query.season === "all" || candidate.seasons.includes(query.season as Season))
    .filter((candidate) => budgetAllows(query.budgetTier, candidate.priceBand))
    .map((candidate) => simulateCandidate(items, candidate, query, baseKeys, temperatureBand))
    .filter((recommendation) => recommendation.unlockCount > 0 || !query.avoidDuplicates)
    .sort((a, b) => b.score - a.score || b.unlockCount - a.unlockCount);
}

function simulateCandidate(
  items: WardrobeItem[],
  candidate: PurchaseCandidate,
  query: BuyNextQuery,
  baseKeys: Set<string>,
  temperatureBand: "hot" | "mild" | "cold"
): PurchaseRecommendation {
  const targetOccasion = query.targetOccasion || "smart-casual";
  const duplicateItems = items.filter(
    (item) =>
      item.status === "active" &&
      item.category === candidate.category &&
      item.primaryColor === candidate.primaryColor
  );

  if (query.avoidDuplicates && duplicateItems.length >= 1) {
    return {
      ...candidate,
      unlockCount: 0,
      score: -999,
      coverageDelta: { [targetOccasion]: 0 },
      confidence: "low",
      reason: "Too close to an item already in the closet.",
      impactedItemIds: [],
      impactedItems: [],
      riskFlags: ["Duplicate risk"]
    };
  }

  const virtualItem: WardrobeItem = {
    id: `candidate_${candidate.key}`,
    name: candidate.name,
    category: candidate.category,
    subcategory: candidate.subcategory,
    primaryColor: candidate.primaryColor,
    pattern: candidate.pattern,
    material: candidate.material,
    warmth: candidate.warmth,
    formality: candidate.formality,
    seasons: candidate.seasons,
    occasions: candidate.occasions,
    fitNotes: "",
    brand: "",
    wearCount: 0,
    lastWornAt: null,
    status: "active",
    imageData: createPlaceholderImage(candidate),
    processingStatus: "ready",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString()
  };

  const futureOutfits = getOutfitSuggestions([...items, virtualItem], {
    occasion: targetOccasion,
    temperatureBand,
    weather: "dry",
    dressLevel: targetOccasion,
    includeItemIds: [virtualItem.id],
    excludeItemIds: [],
    preferLeastWorn: false,
    freshnessBias: 15
  });
  const unlocked = futureOutfits.filter((outfit) => !baseKeys.has(outfitKey(outfit.items)));
  const highConfidence = unlocked.filter((outfit) => outfit.score >= 72);
  const impacted = [
    ...new Map(
      unlocked
        .flatMap((outfit) => outfit.items.filter((item) => item.id !== virtualItem.id))
        .map((item) => [item.id, item] as const)
    ).values()
  ].slice(0, 5);
  const riskFlags = duplicateItems.length ? ["Similar item already owned"] : [];
  const score = highConfidence.length * 10 + impacted.length * 2 - duplicateItems.length * 12;
  const confidence = highConfidence.length >= 8 ? "high" : highConfidence.length >= 4 ? "medium" : "low";
  const reason = highConfidence.length
    ? `${candidate.name} links ${impacted.length || 1} existing pieces and improves ${targetOccasion} coverage without forcing a full wardrobe reset.`
    : `${candidate.name} adds limited incremental value for the current closet shape.`;

  return {
    ...candidate,
    unlockCount: highConfidence.length,
    score,
    coverageDelta: { [targetOccasion]: highConfidence.length },
    confidence,
    reason,
    impactedItemIds: impacted.map((item) => item.id),
    impactedItems: impacted.map((item) => item.name),
    riskFlags
  };
}

function seasonToTemperature(season: BuyNextQuery["season"]) {
  if (season === "summer") return "hot";
  if (season === "winter") return "cold";
  return "mild";
}

function budgetAllows(selected: BuyNextQuery["budgetTier"], candidate: BuyNextQuery["budgetTier"]) {
  const rank = { low: 1, medium: 2, high: 3 };
  return rank[candidate] <= rank[selected] || selected === "high";
}
