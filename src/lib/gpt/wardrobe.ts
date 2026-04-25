import { getOutfitSuggestions } from "@/lib/domain/outfitGenerator";
import { defaultOutfitQuery } from "@/lib/demoData";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ensureDefaultCloset, listWardrobeItems } from "@/lib/supabase/wardrobe-repository";
import type { Occasion, OutfitQuery, SavedOutfit, TemperatureBand, WardrobeItem, Weather } from "@/lib/types";

export type GptWardrobeContext = {
  userId: string;
  profile: {
    id: string;
    displayName: string | null;
    climate: string | null;
    defaultDressLevel: string | null;
  };
  closet: {
    id: string;
    name: string;
  };
  items: GptWardrobeItem[];
};

export type GptWardrobeItem = Omit<WardrobeItem, "imageData"> & {
  imageUrl: string | null;
};

export async function loadGptWardrobe(userId: string): Promise<GptWardrobeContext> {
  const db = createSupabaseServiceRoleClient() as any;
  const closet = await ensureDefaultCloset(db, userId, null);
  const profileResult = await db
    .from("profiles")
    .select("id, display_name, climate_region, default_dress_level")
    .eq("id", userId)
    .maybeSingle();
  if (profileResult.error) throw profileResult.error;

  const items = await listWardrobeItems(db, closet.id);

  return {
    userId,
    profile: {
      id: userId,
      displayName: profileResult.data?.display_name || null,
      climate: profileResult.data?.climate_region || null,
      defaultDressLevel: profileResult.data?.default_dress_level || null
    },
    closet,
    items: items.map(toGptItem)
  };
}

export async function loadGptItem(userId: string, itemId: string) {
  const context = await loadGptWardrobe(userId);
  return {
    context,
    item: context.items.find((item) => item.id === itemId) || null
  };
}

export async function loadGptSavedOutfits(userId: string): Promise<{
  context: GptWardrobeContext;
  outfits: Array<SavedOutfit & { items: GptWardrobeItem[] }>;
}> {
  const context = await loadGptWardrobe(userId);
  const db = createSupabaseServiceRoleClient() as any;
  const outfitResult = await db
    .from("saved_outfits")
    .select("id, name, occasion, created_at")
    .eq("closet_id", context.closet.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (outfitResult.error) throw outfitResult.error;

  const outfitIds = (outfitResult.data || []).map((outfit: { id: string }) => outfit.id);
  const itemRows = outfitIds.length
    ? await db.from("saved_outfit_items").select("outfit_id, item_id, slot").in("outfit_id", outfitIds).order("slot")
    : { data: [], error: null };
  if (itemRows.error) throw itemRows.error;

  const itemById = new Map(context.items.map((item) => [item.id, item]));
  const itemIdsByOutfit = new Map<string, string[]>();
  for (const row of itemRows.data || []) {
    const current = itemIdsByOutfit.get(row.outfit_id) || [];
    current.push(row.item_id);
    itemIdsByOutfit.set(row.outfit_id, current);
  }

  return {
    context,
    outfits: (outfitResult.data || []).map((outfit: { id: string; name: string | null; occasion: string | null; created_at: string }) => {
      const itemIds = itemIdsByOutfit.get(outfit.id) || [];
      return {
        id: outfit.id,
        key: itemIds.sort().join("|"),
        name: outfit.name || itemIds.map((id) => itemById.get(id)?.name).filter(Boolean).join(" + ") || "Saved outfit",
        itemIds,
        occasion: outfit.occasion as Occasion | undefined,
        createdAt: outfit.created_at,
        items: itemIds.map((id) => itemById.get(id)).filter(Boolean) as GptWardrobeItem[]
      };
    })
  };
}

export function buildGptOutfitSuggestions(
  context: GptWardrobeContext,
  query: Partial<OutfitQuery> = {},
  limit = 8
) {
  const cleanQuery = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined)) as Partial<OutfitQuery>;
  const fullQuery: OutfitQuery = {
    ...defaultOutfitQuery,
    ...cleanQuery,
    includeItemIds: cleanQuery.includeItemIds || [],
    excludeItemIds: cleanQuery.excludeItemIds || []
  };
  const sourceItems = context.items.map(fromGptItem);
  return getOutfitSuggestions(sourceItems, fullQuery)
    .slice(0, Math.max(1, Math.min(limit, 12)))
    .map((suggestion) => ({
      id: suggestion.id,
      key: suggestion.key,
      name: suggestion.items.map((item) => item.name).join(" + "),
      itemIds: suggestion.items.map((item) => item.id),
      items: suggestion.items.map(toGptItem),
      score: suggestion.score,
      scoreBreakdown: suggestion.scoreBreakdown,
      rationale: suggestion.rationale,
      substitutions: suggestion.substitutions
    }));
}

export function buildVisualizationBrief(context: GptWardrobeContext, itemIds: string[], note?: string | null) {
  const itemById = new Map(context.items.map((item) => [item.id, item]));
  const selected = itemIds.map((id) => itemById.get(id)).filter(Boolean) as GptWardrobeItem[];
  const outfitName = selected.map((item) => item.name).join(" + ");

  return {
    outfitName: outfitName || "Selected outfit",
    itemIds: selected.map((item) => item.id),
    items: selected,
    visualizationPrompt: [
      "Create a realistic wardrobe visualization using the user's uploaded full-body reference photo if they provide one in ChatGPT.",
      "Preserve the person's body shape, pose, skin tone, and face unless the user asks for an outfit-only moodboard.",
      "Use these WardrobeOS closet items as the clothing source of truth:",
      ...selected.map(
        (item) =>
          `- ${item.name}: ${item.primaryColor} ${item.category}, ${item.subcategory || "unspecified subtype"}, ${item.pattern} pattern, ${item.material} material, formality ${item.formality}/5.`
      ),
      note ? `User styling note: ${note}` : "",
      "If exact garment transfer is uncertain, say this is a styling visualization, not a guaranteed fit preview."
    ]
      .filter(Boolean)
      .join("\n")
  };
}

export function parseOutfitQueryFromSearchParams(searchParams: URLSearchParams): Partial<OutfitQuery> {
  return {
    occasion: parseString(searchParams.get("occasion")) as Occasion | undefined,
    temperatureBand: parseString(searchParams.get("temperatureBand")) as TemperatureBand | undefined,
    weather: parseString(searchParams.get("weather")) as Weather | undefined,
    dressLevel: parseString(searchParams.get("dressLevel")) as Occasion | undefined,
    includeItemIds: parseCsv(searchParams.get("includeItemIds")),
    excludeItemIds: parseCsv(searchParams.get("excludeItemIds")),
    preferLeastWorn: parseBoolean(searchParams.get("preferLeastWorn")),
    freshnessBias: parseNumber(searchParams.get("freshnessBias"))
  };
}

export function toGptItem(item: WardrobeItem): GptWardrobeItem {
  const { imageData, ...rest } = item;
  return {
    ...rest,
    imageUrl: imageData && imageData.startsWith("http") ? imageData : null
  };
}

function fromGptItem(item: GptWardrobeItem): WardrobeItem {
  const { imageUrl, ...rest } = item;
  return {
    ...rest,
    imageData: imageUrl
  };
}

function parseCsv(value: string | null) {
  return value
    ? value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : undefined;
}

function parseBoolean(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseString(value: string | null) {
  return value?.trim() || undefined;
}
