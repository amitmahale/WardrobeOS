import { PURCHASE_CANDIDATES } from "@/lib/constants";
import type { ColorFamily, Confidence, ItemCategory, Occasion, PurchaseCandidate, Season, WardrobeItem } from "@/lib/types";
import { labelize } from "@/lib/utils";

export type ClosetGap = {
  key: string;
  label: string;
  reason: string;
  severity: Confidence;
  category?: ItemCategory;
  occasion?: Occasion;
  season?: Season;
  candidateKeys: string[];
  visual: {
    name: string;
    category: ItemCategory;
    primaryColor: ColorFamily;
  };
};

const categoryMinimums: Record<ItemCategory, number> = {
  top: 5,
  bottom: 4,
  layer: 2,
  outerwear: 2,
  shoes: 2
};

const occasionMinimums: Record<Occasion, number> = {
  casual: 5,
  "smart-casual": 5,
  work: 4,
  dinner: 3,
  travel: 3,
  formal: 2
};

const seasonMinimums: Record<Exclude<Season, "all">, number> = {
  spring: 5,
  summer: 4,
  fall: 5,
  winter: 3
};

const categoryVisuals: Record<ItemCategory, ClosetGap["visual"]> = {
  top: { name: "Crisp versatile top", category: "top", primaryColor: "white" },
  bottom: { name: "Bridge trouser", category: "bottom", primaryColor: "cream" },
  layer: { name: "Smart layer", category: "layer", primaryColor: "charcoal" },
  outerwear: { name: "Weather layer", category: "outerwear", primaryColor: "olive" },
  shoes: { name: "Anchor shoes", category: "shoes", primaryColor: "brown" }
};

export function getClosetGaps(items: WardrobeItem[]): ClosetGap[] {
  const active = items.filter((item) => item.status === "active");
  const gaps: ClosetGap[] = [];

  for (const [category, minimum] of Object.entries(categoryMinimums) as Array<[ItemCategory, number]>) {
    const count = active.filter((item) => item.category === category).length;
    if (count < minimum) {
      gaps.push({
        key: `category:${category}`,
        label: count === 0 ? `No ${labelize(category)} cataloged` : `Thin ${labelize(category)} bench`,
        reason:
          count === 0
            ? `Add at least one ${labelize(category)} before trusting outfit coverage.`
            : `${count}/${minimum} active ${labelize(category)} pieces limits outfit variety.`,
        severity: count === 0 ? "high" : "medium",
        category,
        candidateKeys: candidateKeysFor((candidate) => candidate.category === category),
        visual: categoryVisuals[category]
      });
    }
  }

  for (const [occasion, minimum] of Object.entries(occasionMinimums) as Array<[Occasion, number]>) {
    const count = active.filter((item) => item.occasions.includes(occasion)).length;
    if (count < minimum) {
      const candidate = PURCHASE_CANDIDATES.find((entry) => entry.occasions.includes(occasion));
      gaps.push({
        key: `occasion:${occasion}`,
        label: `${labelize(occasion)} coverage gap`,
        reason: `${count}/${minimum} active pieces support ${labelize(occasion)} outfits.`,
        severity: count <= 1 ? "high" : "medium",
        occasion,
        candidateKeys: candidateKeysFor((entry) => entry.occasions.includes(occasion)),
        visual: candidate
          ? { name: candidate.name, category: candidate.category, primaryColor: candidate.primaryColor }
          : { name: `${labelize(occasion)} capsule`, category: "layer", primaryColor: "navy" }
      });
    }
  }

  for (const [season, minimum] of Object.entries(seasonMinimums) as Array<[Exclude<Season, "all">, number]>) {
    const count = active.filter((item) => item.seasons.includes(season) || item.seasons.includes("all")).length;
    if (count < minimum) {
      const candidate = PURCHASE_CANDIDATES.find((entry) => entry.seasons.includes(season) || entry.seasons.includes("all"));
      gaps.push({
        key: `season:${season}`,
        label: `${labelize(season)} readiness gap`,
        reason: `${count}/${minimum} pieces are tagged for ${labelize(season)}.`,
        severity: count <= 1 ? "high" : "medium",
        season,
        candidateKeys: candidateKeysFor((entry) => entry.seasons.includes(season) || entry.seasons.includes("all")),
        visual: candidate
          ? { name: candidate.name, category: candidate.category, primaryColor: candidate.primaryColor }
          : { name: `${labelize(season)} piece`, category: "outerwear", primaryColor: "olive" }
      });
    }
  }

  return dedupeGaps(gaps).sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

export function summarizeCandidateGap(
  items: WardrobeItem[],
  candidate: PurchaseCandidate,
  targetOccasion: Occasion
): Pick<ClosetGap, "label" | "reason" | "severity"> {
  const active = items.filter((item) => item.status === "active");
  const categoryCount = active.filter((item) => item.category === candidate.category).length;
  if (categoryCount === 0) {
    return {
      label: `Fills missing ${labelize(candidate.category)}`,
      reason: `You currently have no active ${labelize(candidate.category)} cataloged, so this unlocks a full outfit slot.`,
      severity: "high"
    };
  }

  const targetOccasionCount = active.filter((item) => item.occasions.includes(targetOccasion)).length;
  if (candidate.occasions.includes(targetOccasion) && targetOccasionCount < occasionMinimums[targetOccasion]) {
    return {
      label: `${labelize(targetOccasion)} coverage`,
      reason: `${targetOccasionCount}/${occasionMinimums[targetOccasion]} pieces currently support ${labelize(targetOccasion)}.`,
      severity: targetOccasionCount <= 1 ? "high" : "medium"
    };
  }

  const seasonalGap = (Object.keys(seasonMinimums) as Array<Exclude<Season, "all">>).find((season) => {
    const seasonCount = active.filter((item) => item.seasons.includes(season) || item.seasons.includes("all")).length;
    return (candidate.seasons.includes(season) || candidate.seasons.includes("all")) && seasonCount < seasonMinimums[season];
  });
  if (seasonalGap) {
    const seasonCount = active.filter((item) => item.seasons.includes(seasonalGap) || item.seasons.includes("all")).length;
    return {
      label: `${labelize(seasonalGap)} readiness`,
      reason: `${seasonCount}/${seasonMinimums[seasonalGap]} pieces are tagged for ${labelize(seasonalGap)}.`,
      severity: seasonCount <= 1 ? "high" : "medium"
    };
  }

  return {
    label: "Outfit multiplier",
    reason: "This candidate scores on actual outfit unlocks rather than a simple missing-category rule.",
    severity: "low"
  };
}

function candidateKeysFor(predicate: (candidate: PurchaseCandidate) => boolean) {
  return PURCHASE_CANDIDATES.filter(predicate)
    .map((candidate) => candidate.key)
    .slice(0, 4);
}

function dedupeGaps(gaps: ClosetGap[]) {
  const seen = new Set<string>();
  return gaps.filter((gap) => {
    if (seen.has(gap.key)) return false;
    seen.add(gap.key);
    return true;
  });
}

function severityRank(severity: Confidence) {
  return severity === "high" ? 3 : severity === "medium" ? 2 : 1;
}
