import { scoreOutfit } from "@/lib/domain/outfitScorer";
import type { OutfitQuery, OutfitRecommendation, WardrobeItem } from "@/lib/types";

export function getActiveItemsByCategory(items: WardrobeItem[], category: WardrobeItem["category"]) {
  return items.filter((item) => item.status === "active" && item.category === category);
}

export function getOutfitSuggestions(items: WardrobeItem[], query: OutfitQuery): OutfitRecommendation[] {
  const excluded = new Set(query.excludeItemIds || []);
  const included = new Set(query.includeItemIds || []);
  const eligible = items.filter((item) => item.status === "active" && !excluded.has(item.id));
  const tops = eligible.filter((item) => item.category === "top");
  const bottoms = eligible.filter((item) => item.category === "bottom");
  const layers = eligible.filter((item) => item.category === "layer" || item.category === "outerwear");
  const shoes = eligible.filter((item) => item.category === "shoes");
  const results: OutfitRecommendation[] = [];

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const layer of [null, ...layers]) {
        for (const shoe of shoes.length ? shoes : [null]) {
          const outfitItems = [top, bottom, layer, shoe].filter(Boolean) as WardrobeItem[];
          if (included.size && ![...included].every((id) => outfitItems.some((item) => item.id === id))) {
            continue;
          }
          const evaluation = scoreOutfit(outfitItems, query);
          if (!evaluation.valid) continue;
          results.push({
            key: outfitKey(outfitItems),
            id: `outfit_rec_${results.length + 1}`,
            items: outfitItems,
            score: evaluation.score,
            scoreBreakdown: evaluation.breakdown,
            rationale: evaluation.rationale,
            substitutions: buildSubstitutions(outfitItems, eligible)
          });
        }
      }
    }
  }

  return dedupeBy(results, (result) => result.key)
    .sort((a, b) => b.score - a.score)
    .slice(0, 24);
}

export function outfitKey(items: WardrobeItem[]) {
  return items.map((item) => item.id).sort().join("|");
}

function dedupeBy<T>(list: T[], keyFn: (value: T) => string) {
  const map = new Map<string, T>();
  for (const item of list) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

function buildSubstitutions(outfitItems: WardrobeItem[], eligible: WardrobeItem[]) {
  return outfitItems.flatMap((item) => {
    const replacement = eligible.find(
      (other) =>
        other.id !== item.id &&
        other.category === item.category &&
        other.formality >= item.formality - 1 &&
        other.formality <= item.formality + 1 &&
        other.occasions.some((occasion) => item.occasions.includes(occasion))
    );
    return replacement ? [{ replaceItemId: item.id, withItemId: replacement.id }] : [];
  });
}
