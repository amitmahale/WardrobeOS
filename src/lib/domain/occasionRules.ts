import type { Occasion, WardrobeItem } from "@/lib/types";

export function occasionFit(item: WardrobeItem, occasion: Occasion) {
  if ((item.occasions || []).includes(occasion)) return 8;
  if (occasion === "work" && item.formality >= 3) return 6;
  if (occasion === "dinner" && item.formality >= 2) return 5;
  if (occasion === "formal" && item.formality >= 4) return 8;
  if (occasion === "casual" && item.formality <= 2) return 6;
  if (occasion === "travel") return 4;
  if (occasion === "smart-casual" && item.formality >= 2 && item.formality <= 4) return 6;
  return 2;
}

export function suggestContextsForItem(item: WardrobeItem) {
  const suggestions = new Set<Occasion>(item.occasions || []);
  if (item.category === "layer" || item.category === "outerwear") suggestions.add("travel");
  if (item.formality >= 3) suggestions.add("work");
  if (["burgundy", "navy", "olive"].includes(item.primaryColor)) suggestions.add("smart-casual");
  return [...suggestions];
}
