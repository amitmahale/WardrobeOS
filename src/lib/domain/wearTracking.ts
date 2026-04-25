import type { WardrobeItem, WearLogEntry } from "@/lib/types";

export type EnrichedWearLogEntry = WearLogEntry & {
  items: WardrobeItem[];
  label: string;
};

export function getQuickWearCandidates(items: WardrobeItem[], limit = 6) {
  return [...items]
    .filter((item) => item.status === "active")
    .sort((a, b) => {
      const aLast = a.lastWornAt ? Date.parse(a.lastWornAt) : 0;
      const bLast = b.lastWornAt ? Date.parse(b.lastWornAt) : 0;
      return bLast - aLast || Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    })
    .slice(0, limit);
}

export function getRecentWearEvents(wearLog: WearLogEntry[], items: WardrobeItem[], limit = 5): EnrichedWearLogEntry[] {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  return wearLog
    .map((entry) => {
      const entryItems = entry.itemIds.map((id) => itemMap.get(id)).filter((item): item is WardrobeItem => Boolean(item));
      return {
        ...entry,
        items: entryItems,
        label: entry.outfitName || entryItems.map((item) => item.name).join(" + ") || "Wear event"
      };
    })
    .filter((entry) => entry.items.length)
    .sort((a, b) => Date.parse(b.wornAt) - Date.parse(a.wornAt))
    .slice(0, limit);
}

export function getWearActivity(wearLog: WearLogEntry[], items: WardrobeItem[], dayCount = 14, now = new Date()) {
  const days = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (dayCount - 1 - index));
    return {
      key: toDateKey(date),
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: 0
    };
  });
  const counts = new Map(days.map((day) => [day.key, day]));

  if (wearLog.length) {
    for (const entry of wearLog) {
      const bucket = counts.get(toDateKey(new Date(entry.wornAt)));
      if (bucket) bucket.count += Math.max(1, entry.itemIds.length);
    }
    return days;
  }

  for (const item of items) {
    if (!item.lastWornAt) continue;
    const bucket = counts.get(toDateKey(new Date(item.lastWornAt)));
    if (bucket) bucket.count += 1;
  }
  return days;
}

export function getTodaysWearCount(wearLog: WearLogEntry[], now = new Date()) {
  const today = toDateKey(now);
  return wearLog
    .filter((entry) => toDateKey(new Date(entry.wornAt)) === today)
    .reduce((total, entry) => total + Math.max(1, entry.itemIds.length), 0);
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
