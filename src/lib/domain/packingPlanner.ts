import { getActiveItemsByCategory } from "@/lib/domain/outfitGenerator";
import { occasionFit } from "@/lib/domain/occasionRules";
import type { ItemCategory, PackPlan, PackQuery, WardrobeItem } from "@/lib/types";

export function getPackPlan(items: WardrobeItem[], query: PackQuery): PackPlan {
  const topCount = query.laundryAccess
    ? Math.min(3, query.tripLengthDays)
    : Math.min(4, Math.ceil(query.tripLengthDays * 0.75));
  const bottomCount = query.tripLengthDays <= 3 ? 1 : 2;
  const layerCount = query.weather === "cold" ? 2 : 1;
  const outerwearCount = query.weather === "cold" ? 1 : 0;
  const shoeCount = Math.max(1, Number(query.shoeLimit) || 2);
  const preferredOccasion = query.primaryOccasion === "mixed" ? "smart-casual" : query.primaryOccasion;

  const tops = getActiveItemsByCategory(items, "top").sort(sortForCapsule(preferredOccasion)).slice(0, topCount);
  const bottoms = getActiveItemsByCategory(items, "bottom")
    .sort(sortForCapsule(preferredOccasion))
    .slice(0, bottomCount);
  const layers = getActiveItemsByCategory(items, "layer")
    .sort(sortForCapsule(preferredOccasion))
    .slice(0, layerCount);
  const outerwear = getActiveItemsByCategory(items, "outerwear")
    .sort(sortForCapsule(preferredOccasion))
    .slice(0, outerwearCount);
  const shoes = getActiveItemsByCategory(items, "shoes").sort(sortForCapsule(preferredOccasion)).slice(0, shoeCount);
  const allItems = [...tops, ...bottoms, ...layers, ...outerwear, ...shoes];
  const outfitCount = Math.max(1, tops.length * bottoms.length * Math.max(1, Math.min(2, shoes.length)));
  const note =
    query.primaryOccasion === "mixed"
      ? "Built to cover mixed use without overpacking."
      : `Built around ${preferredOccasion} as the main trip context.`;

  return {
    items: allItems,
    outfitCount,
    note,
    counts: {
      top: tops.length,
      bottom: bottoms.length,
      layer: layers.length,
      outerwear: outerwear.length,
      shoes: shoes.length
    } satisfies Record<ItemCategory, number>
  };
}

function sortForCapsule(occasion: PackQuery["primaryOccasion"]) {
  return (a: WardrobeItem, b: WardrobeItem) => {
    if (occasion === "mixed") return (a.wearCount || 0) - (b.wearCount || 0);
    const aFit = occasionFit(a, occasion);
    const bFit = occasionFit(b, occasion);
    if (bFit !== aFit) return bFit - aFit;
    return (a.wearCount || 0) - (b.wearCount || 0);
  };
}
