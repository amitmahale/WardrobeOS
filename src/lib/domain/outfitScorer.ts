import { colorCompatibility } from "@/lib/domain/colorCompatibility";
import { formalityGap, formalityScore } from "@/lib/domain/formalityRules";
import { occasionFit } from "@/lib/domain/occasionRules";
import { seasonFit, weatherFit } from "@/lib/domain/seasonRules";
import type { OutfitQuery, WardrobeItem } from "@/lib/types";
import { average, clamp, sum } from "@/lib/utils";

type ScoreResult =
  | {
      valid: true;
      score: number;
      breakdown: {
        occasion: number;
        color: number;
        formality: number;
        weather: number;
        rotation: number;
      };
      rationale: string;
    }
  | { valid: false };

export function scoreOutfit(items: WardrobeItem[], query: OutfitQuery): ScoreResult {
  const top = items.find((item) => item.category === "top");
  const bottom = items.find((item) => item.category === "bottom");
  const layer = items.find((item) => item.category === "layer" || item.category === "outerwear");
  const shoe = items.find((item) => item.category === "shoes");

  if (!top || !bottom) return { valid: false };

  const gap = formalityGap(items, query.dressLevel);
  if (gap > 1.8) return { valid: false };

  const occasionScore = sum(items.map((item) => occasionFit(item, query.occasion)));
  if (occasionScore < 8) return { valid: false };

  const seasonScore = sum(items.map((item) => seasonFit(item, query.temperatureBand)));
  if (seasonScore < 8) return { valid: false };

  const colorScore = Math.round(
    ((colorCompatibility(top.primaryColor, bottom.primaryColor) +
      (layer ? colorCompatibility(layer.primaryColor, bottom.primaryColor) : 8) +
      (shoe ? colorCompatibility(shoe.primaryColor, bottom.primaryColor) : 7)) /
      3) *
      2.2
  );
  const scoredFormality = formalityScore(items, query.dressLevel);
  const scoredWeather = Math.round(weatherFit(items, query.temperatureBand, query.weather));
  const rotationScore = query.preferLeastWorn ? Math.round(rotationBoost(items, query.freshnessBias)) : 8;
  const total = clamp(colorScore + occasionScore + scoredFormality + scoredWeather + rotationScore, 0, 100);

  if (total < 60) return { valid: false };

  return {
    valid: true,
    score: total,
    breakdown: {
      occasion: occasionScore,
      color: colorScore,
      formality: scoredFormality,
      weather: scoredWeather,
      rotation: rotationScore
    },
    rationale: buildOutfitRationale(
      { colorScore, occasionScore, rotationScore, hasLayer: Boolean(layer), total },
      query
    )
  };
}

export function rotationBoost(items: WardrobeItem[], freshnessBias: number) {
  const lowWear = average(items.map((item) => Math.max(0, 12 - Math.min(item.wearCount || 0, 12))));
  return clamp(4 + lowWear * (freshnessBias / 100), 4, 16);
}

function buildOutfitRationale(
  meta: {
    colorScore: number;
    occasionScore: number;
    rotationScore: number;
    hasLayer: boolean;
    total: number;
  },
  query: OutfitQuery
) {
  const bits = [
    meta.colorScore >= 18 ? "Strong color pairing" : "Balanced color pairing",
    meta.occasionScore >= 20 ? `clear ${query.occasion} fit` : `good enough for ${query.occasion}`
  ];

  if (meta.rotationScore >= 11) bits.push("rotation boost from lower-wear pieces");
  if (meta.hasLayer && query.temperatureBand === "cold") bits.push("layer support for cooler weather");
  if (meta.total >= 86) bits.push("high confidence across the core rules");

  return `${bits[0]}, ${bits.slice(1).join(", ")}.`;
}
