import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type {
  ColorFamily,
  ItemCategory,
  ItemDraft,
  ItemStatus,
  Occasion,
  Season,
  WardrobeItem
} from "@/lib/types";

type TypedSupabaseClient = SupabaseClient<Database, "public", any>;

export async function ensureDefaultCloset(supabase: TypedSupabaseClient, userId: string, email?: string | null) {
  await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: email?.split("@")[0] || "Wardrobe user",
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  const existing = await supabase
    .from("closets")
    .select("id, name")
    .eq("owner_user_id", userId)
    .eq("is_default", true)
    .maybeSingle();

  if (existing.data) return existing.data;

  const inserted = await supabase
    .from("closets")
    .insert({ owner_user_id: userId, name: "My Closet", slug: "my-closet", is_default: true })
    .select("id, name")
    .single();

  if (inserted.error) throw inserted.error;

  const member = await supabase
    .from("closet_members")
    .insert({ closet_id: inserted.data.id, user_id: userId, role: "owner" });

  if (member.error) throw member.error;
  return inserted.data;
}

export async function listWardrobeItems(supabase: TypedSupabaseClient, closetId: string) {
  const { data, error } = await supabase
    .from("items")
    .select("*, item_images(*)")
    .eq("closet_id", closetId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => toWardrobeItem(row as ItemRowWithImages));
}

export async function createWardrobeItem(
  supabase: TypedSupabaseClient,
  closetId: string,
  draft: ItemDraft,
  imagePath?: string | null
) {
  const insert = fromDraft(closetId, draft, imagePath);
  const { data, error } = await supabase.from("items").insert(insert).select("*").single();
  if (error) throw error;

  if (imagePath) {
    const image = await supabase.from("item_images").insert({
      item_id: data.id,
      original_path: imagePath,
      display_path: imagePath,
      thumb_path: imagePath,
      processing_status: "ready",
      mime_type: "image/jpeg",
      ai_suggestion_status: "not_requested"
    });
    if (image.error) throw image.error;
  }

  return toWardrobeItem({ ...data, item_images: [] });
}

export async function updateWardrobeItem(
  supabase: TypedSupabaseClient,
  itemId: string,
  patch: Partial<WardrobeItem>,
  closetId?: string
) {
  const update = toItemUpdate(patch);
  let query = supabase.from("items").update(update).eq("id", itemId);
  if (closetId) query = query.eq("closet_id", closetId);
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return toWardrobeItem({ ...data, item_images: [] });
}

type ItemRow = Database["public"]["Tables"]["items"]["Row"];
type ItemImageRow = Database["public"]["Tables"]["item_images"]["Row"];
type ItemRowWithImages = ItemRow & { item_images?: ItemImageRow[] };

export function toWardrobeItem(row: ItemRowWithImages): WardrobeItem {
  const image = row.item_images?.[0];
  return {
    id: row.id,
    name: row.name,
    category: row.category as ItemCategory,
    subcategory: row.subcategory || "",
    primaryColor: row.primary_color as ColorFamily,
    secondaryColor: (row.secondary_color as ColorFamily | null) || null,
    pattern: row.pattern || "solid",
    material: row.material || "cotton",
    warmth: row.warmth,
    formality: row.formality,
    seasons: row.seasons as Season[],
    occasions: row.occasions as Occasion[],
    fitNotes: row.fit_notes || "",
    brand: row.brand || "",
    imageData: image?.display_path ? getPublicImageUrl(image.display_path) : null,
    imageName: image?.original_path?.split("/").at(-1) || "",
    processingStatus: image?.processing_status || "ready",
    wearCount: row.wear_count,
    lastWornAt: row.last_worn_at,
    status: row.status as ItemStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function fromDraft(closetId: string, draft: ItemDraft, imagePath?: string | null) {
  return {
    closet_id: closetId,
    name: draft.name,
    category: draft.category,
    subcategory: draft.subcategory || null,
    primary_color: draft.primaryColor,
    secondary_color: draft.secondaryColor || null,
    pattern: draft.pattern,
    material: draft.material,
    warmth: draft.warmth,
    formality: draft.formality,
    seasons: draft.seasons,
    occasions: draft.occasions,
    fit_notes: draft.fitNotes,
    brand: draft.brand || null,
    status: "active" as const,
    metadata: { imagePath: imagePath || null } satisfies Json
  };
}

function toItemUpdate(patch: Partial<WardrobeItem>) {
  return {
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.subcategory !== undefined ? { subcategory: patch.subcategory } : {}),
    ...(patch.primaryColor !== undefined ? { primary_color: patch.primaryColor } : {}),
    ...(patch.secondaryColor !== undefined ? { secondary_color: patch.secondaryColor } : {}),
    ...(patch.pattern !== undefined ? { pattern: patch.pattern } : {}),
    ...(patch.material !== undefined ? { material: patch.material } : {}),
    ...(patch.warmth !== undefined ? { warmth: patch.warmth } : {}),
    ...(patch.formality !== undefined ? { formality: patch.formality } : {}),
    ...(patch.seasons !== undefined ? { seasons: patch.seasons } : {}),
    ...(patch.occasions !== undefined ? { occasions: patch.occasions } : {}),
    ...(patch.fitNotes !== undefined ? { fit_notes: patch.fitNotes } : {}),
    ...(patch.brand !== undefined ? { brand: patch.brand } : {}),
    ...(patch.wearCount !== undefined ? { wear_count: patch.wearCount } : {}),
    ...(patch.lastWornAt !== undefined ? { last_worn_at: patch.lastWornAt } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    updated_at: new Date().toISOString()
  };
}

function getPublicImageUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;
  return `${baseUrl}/storage/v1/object/public/item-images/${path}`;
}
