import type { TemperatureBand, WardrobeItem, Weather } from "@/lib/types";
import { average, clamp } from "@/lib/utils";

export function seasonFit(item: WardrobeItem, temperatureBand: TemperatureBand) {
  const seasons = item.seasons || [];
  if (seasons.includes("all")) return 5;
  if (temperatureBand === "hot") {
    if (item.warmth >= 4) return 1;
    if (seasons.includes("summer") || seasons.includes("spring")) return 5;
    return 3;
  }
  if (temperatureBand === "cold") {
    if (item.warmth <= 1) return 2;
    if (seasons.includes("winter") || seasons.includes("fall")) return 5;
    return 4;
  }
  if (
    seasons.includes("spring") ||
    seasons.includes("fall") ||
    seasons.includes("summer") ||
    seasons.includes("winter")
  ) {
    return 4;
  }
  return 3;
}

export function weatherFit(items: WardrobeItem[], temperatureBand: TemperatureBand, weather: Weather) {
  let score = 16;
  const hasLayer = items.some((item) => item.category === "layer" || item.category === "outerwear");
  const avgWarmth = average(items.map((item) => item.warmth || 2));

  if (temperatureBand === "cold") {
    if (!hasLayer) score -= 6;
    if (avgWarmth < 2.2) score -= 4;
  }

  if (temperatureBand === "hot") {
    if (hasLayer) score -= 4;
    if (avgWarmth > 2.6) score -= 4;
  }

  if (weather === "rainy" && !items.some((item) => item.category === "outerwear")) {
    score -= 2;
  }

  return clamp(score, 6, 18);
}
