import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { listWardrobeItems } from "@/lib/supabase/wardrobe-repository";
import type { Occasion, SavedVisualization, WardrobeItem } from "@/lib/types";

type TypedSupabaseClient = SupabaseClient<Database, "public", any>;

type VisualizationNotes = {
  kind: "wardrobeos.visualization.v1";
  prompt?: string;
  stylingNotes?: string;
  imagePath?: string | null;
  imageUrl?: string | null;
  source?: "chatgpt" | "wardrobeos";
  openaiFileId?: string | null;
  openaiFileName?: string | null;
  mimeType?: string | null;
};

type VisualizationRow = {
  id: string;
  name: string | null;
  occasion: string | null;
  notes: string | null;
  created_at: string;
};

type ParsedVisualizationRow = {
  row: VisualizationRow;
  notes: VisualizationNotes;
};

export type CreateVisualizationInput = {
  title: string;
  itemIds: string[];
  occasion?: Occasion | null;
  prompt: string;
  stylingNotes?: string | null;
  imagePath?: string | null;
  imageUrl?: string | null;
  source?: "chatgpt" | "wardrobeos";
  openaiFileId?: string | null;
  openaiFileName?: string | null;
  mimeType?: string | null;
};

export async function createSavedVisualization(
  supabase: TypedSupabaseClient,
  closetId: string,
  input: CreateVisualizationInput
) {
  const notes: VisualizationNotes = {
    kind: "wardrobeos.visualization.v1",
    prompt: input.prompt,
    stylingNotes: input.stylingNotes || "",
    imagePath: input.imagePath || null,
    imageUrl: input.imageUrl || null,
    source: input.source || "chatgpt",
    openaiFileId: input.openaiFileId || null,
    openaiFileName: input.openaiFileName || null,
    mimeType: input.mimeType || null
  };

  const outfit = await (supabase as any)
    .from("saved_outfits")
    .insert({
      closet_id: closetId,
      name: input.title,
      source: "recommendation",
      occasion: input.occasion || null,
      notes: JSON.stringify(notes)
    })
    .select("id, name, occasion, notes, created_at")
    .single();
  if (outfit.error) throw outfit.error;

  if (input.itemIds.length) {
    const itemRows = input.itemIds.map((itemId, index) => ({
      outfit_id: outfit.data.id,
      item_id: itemId,
      slot: `slot_${index + 1}`
    }));
    const items = await (supabase as any).from("saved_outfit_items").insert(itemRows);
    if (items.error) throw items.error;
  }

  return outfit.data as { id: string; name: string | null; occasion: string | null; notes: string | null; created_at: string };
}

export async function listSavedVisualizations(supabase: TypedSupabaseClient, closetId: string) {
  const outfitResult = await (supabase as any)
    .from("saved_outfits")
    .select("id, name, occasion, notes, created_at")
    .eq("closet_id", closetId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (outfitResult.error) throw outfitResult.error;

  const rows = ((outfitResult.data || []) as VisualizationRow[])
    .map((row) => ({ row, notes: parseVisualizationNotes(row.notes) }))
    .filter((entry): entry is ParsedVisualizationRow => Boolean(entry.notes));

  if (!rows.length) return [];

  const outfitIds = rows.map((entry) => entry.row.id);
  const itemRows = await (supabase as any)
    .from("saved_outfit_items")
    .select("outfit_id, item_id, slot")
    .in("outfit_id", outfitIds)
    .order("slot");
  if (itemRows.error) throw itemRows.error;

  const wardrobeItems = await listWardrobeItems(supabase, closetId);
  const itemById = new Map(wardrobeItems.map((item) => [item.id, item]));
  const itemIdsByOutfit = new Map<string, string[]>();
  for (const row of itemRows.data || []) {
    const current = itemIdsByOutfit.get(row.outfit_id) || [];
    current.push(row.item_id);
    itemIdsByOutfit.set(row.outfit_id, current);
  }

  return rows.map(({ row, notes }) => toSavedVisualization(row, notes, itemIdsByOutfit.get(row.id) || [], itemById));
}

export function parseVisualizationNotes(value?: string | null): VisualizationNotes | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<VisualizationNotes>;
    return parsed.kind === "wardrobeos.visualization.v1" ? (parsed as VisualizationNotes) : null;
  } catch {
    return null;
  }
}

function toSavedVisualization(
  row: { id: string; name: string | null; occasion: string | null; created_at: string },
  notes: VisualizationNotes,
  itemIds: string[],
  itemById: Map<string, WardrobeItem>
): SavedVisualization {
  return {
    id: row.id,
    title: row.name || "Saved visualization",
    itemIds,
    occasion: (row.occasion as Occasion | null) || null,
    prompt: notes.prompt || "",
    stylingNotes: notes.stylingNotes || "",
    imagePath: notes.imagePath || null,
    imageUrl: notes.imageUrl || null,
    source: notes.source || "chatgpt",
    createdAt: row.created_at,
    items: itemIds
      .map((id) => itemById.get(id))
      .filter(Boolean)
      .map((item) => ({
        id: item!.id,
        name: item!.name,
        category: item!.category,
        primaryColor: item!.primaryColor,
        imageData: item!.imageData
      }))
  };
}
