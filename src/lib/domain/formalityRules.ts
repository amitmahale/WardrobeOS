import { DRESS_LEVEL_TO_FORMALITY } from "@/lib/constants";
import type { Occasion, WardrobeItem } from "@/lib/types";
import { average } from "@/lib/utils";

export function targetFormality(dressLevel: Occasion) {
  return DRESS_LEVEL_TO_FORMALITY[dressLevel] ?? 3;
}

export function averageFormality(items: WardrobeItem[]) {
  return average(items.map((item) => item.formality || 2));
}

export function formalityGap(items: WardrobeItem[], dressLevel: Occasion) {
  return Math.abs(averageFormality(items) - targetFormality(dressLevel));
}

export function formalityScore(items: WardrobeItem[], dressLevel: Occasion) {
  return Math.max(8, Math.round(24 - formalityGap(items, dressLevel) * 8));
}
