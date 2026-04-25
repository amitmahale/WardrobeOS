import { createPlaceholderImage } from "@/lib/domain/placeholderImage";
import type {
  BuyNextQuery,
  ClosetFilters,
  ItemDraft,
  OutfitQuery,
  PackQuery,
  StyleProfile,
  WardrobeItem
} from "@/lib/types";

export function emptyDraft(): ItemDraft {
  return {
    name: "",
    category: "top",
    subcategory: "",
    primaryColor: "navy",
    secondaryColor: null,
    pattern: "solid",
    material: "cotton",
    warmth: 2,
    formality: 2,
    seasons: ["spring", "fall"],
    occasions: ["casual"],
    fitNotes: "",
    imageData: null,
    imageName: "",
    brand: ""
  };
}

export const defaultClosetFilters: ClosetFilters = {
  search: "",
  category: "all",
  color: "all",
  occasion: "all",
  season: "all",
  sort: "recent",
  view: "grid"
};

export const defaultOutfitQuery: OutfitQuery = {
  occasion: "work",
  temperatureBand: "mild",
  weather: "dry",
  dressLevel: "smart-casual",
  includeItemIds: [],
  excludeItemIds: [],
  preferLeastWorn: true,
  freshnessBias: 35
};

export const defaultBuyNextQuery: BuyNextQuery = {
  budgetTier: "medium",
  targetOccasion: "smart-casual",
  season: "all",
  preferredCategory: "all",
  avoidDuplicates: true
};

export const defaultPackQuery: PackQuery = {
  tripLengthDays: 4,
  primaryOccasion: "mixed",
  weather: "mild",
  laundryAccess: false,
  shoeLimit: 2
};

export const defaultStyleProfile: StyleProfile = {
  displayName: "Demo user",
  climate: "Mild coastal",
  defaultDressLevel: "smart-casual",
  favoriteColors: ["navy", "olive", "cream"],
  avoidedColors: ["burgundy"],
  shoppingPhilosophy: "balanced",
  budgetBand: "medium"
};

export function createSeedItems(): WardrobeItem[] {
  return [
    seedItem(
      "itm_navy_oxford",
      "Navy Oxford Shirt",
      "top",
      "oxford-shirt",
      "navy",
      "solid",
      "cotton",
      2,
      3,
      ["spring", "fall", "winter"],
      ["work", "smart-casual", "dinner"],
      8,
      "2026-04-19T12:00:00.000Z"
    ),
    seedItem(
      "itm_white_tee",
      "White Heavy Tee",
      "top",
      "t-shirt",
      "white",
      "solid",
      "cotton",
      1,
      1,
      ["spring", "summer", "fall"],
      ["casual", "travel"],
      12,
      "2026-04-22T09:00:00.000Z"
    ),
    seedItem(
      "itm_chambray",
      "Blue Chambray Shirt",
      "top",
      "chambray-shirt",
      "blue",
      "solid",
      "cotton",
      2,
      2,
      ["spring", "summer", "fall", "winter"],
      ["casual", "smart-casual"],
      4,
      "2026-04-14T08:00:00.000Z"
    ),
    seedItem(
      "itm_navy_poplin",
      "Navy Poplin Shirt",
      "top",
      "button-down-shirt",
      "navy",
      "solid",
      "cotton",
      2,
      3,
      ["spring", "summer", "fall"],
      ["work", "smart-casual"],
      1,
      "2026-03-12T08:00:00.000Z"
    ),
    seedItem(
      "itm_burgundy_polo",
      "Burgundy Knit Polo",
      "top",
      "knit-polo",
      "burgundy",
      "solid",
      "cotton",
      2,
      2,
      ["spring", "summer", "fall"],
      ["casual", "dinner", "smart-casual"],
      2,
      "2026-04-10T13:00:00.000Z"
    ),
    seedItem(
      "itm_gray_crewneck",
      "Gray Merino Crewneck",
      "layer",
      "sweater",
      "gray",
      "solid",
      "merino",
      3,
      3,
      ["fall", "winter", "spring"],
      ["work", "smart-casual", "travel"],
      5,
      "2026-04-12T10:00:00.000Z"
    ),
    seedItem(
      "itm_olive_overshirt",
      "Olive Overshirt",
      "layer",
      "overshirt",
      "olive",
      "solid",
      "cotton",
      2,
      2,
      ["spring", "fall"],
      ["casual", "travel", "smart-casual"],
      1,
      "2026-03-01T10:00:00.000Z"
    ),
    seedItem(
      "itm_navy_blazer",
      "Navy Blazer",
      "layer",
      "blazer",
      "navy",
      "solid",
      "wool-blend",
      3,
      4,
      ["spring", "fall", "winter"],
      ["work", "dinner"],
      3,
      "2026-04-08T09:00:00.000Z"
    ),
    seedItem(
      "itm_camel_jacket",
      "Camel Field Jacket",
      "outerwear",
      "jacket",
      "camel",
      "solid",
      "cotton",
      4,
      2,
      ["fall", "winter", "spring"],
      ["casual", "travel"],
      2,
      "2026-04-01T09:00:00.000Z"
    ),
    seedItem(
      "itm_charcoal_trousers",
      "Charcoal Trousers",
      "bottom",
      "trousers",
      "charcoal",
      "solid",
      "wool",
      2,
      4,
      ["spring", "summer", "fall", "winter"],
      ["work", "dinner"],
      6,
      "2026-04-21T07:00:00.000Z"
    ),
    seedItem(
      "itm_khaki_chinos",
      "Khaki Chinos",
      "bottom",
      "chinos",
      "khaki",
      "solid",
      "cotton",
      2,
      2,
      ["spring", "summer", "fall"],
      ["casual", "smart-casual", "work", "travel"],
      7,
      "2026-04-20T11:00:00.000Z"
    ),
    seedItem(
      "itm_dark_denim",
      "Dark Denim Jeans",
      "bottom",
      "jeans",
      "blue",
      "solid",
      "denim",
      2,
      1,
      ["spring", "summer", "fall", "winter"],
      ["casual", "dinner", "travel"],
      9,
      "2026-04-18T19:00:00.000Z"
    ),
    seedItem(
      "itm_black_trousers",
      "Black Slim Trousers",
      "bottom",
      "trousers",
      "black",
      "solid",
      "wool-blend",
      2,
      4,
      ["spring", "summer", "fall", "winter"],
      ["work", "dinner", "formal"],
      2,
      "2026-04-07T12:00:00.000Z"
    ),
    seedItem(
      "itm_white_sneakers",
      "White Leather Sneakers",
      "shoes",
      "sneakers",
      "white",
      "solid",
      "leather",
      2,
      1,
      ["spring", "summer", "fall", "winter"],
      ["casual", "travel"],
      10,
      "2026-04-22T18:00:00.000Z"
    ),
    seedItem(
      "itm_brown_loafers",
      "Brown Suede Loafers",
      "shoes",
      "loafers",
      "brown",
      "solid",
      "suede",
      2,
      3,
      ["spring", "summer", "fall"],
      ["work", "dinner", "smart-casual"],
      4,
      "2026-04-17T18:00:00.000Z"
    ),
    seedItem(
      "itm_black_derbies",
      "Black Derbies",
      "shoes",
      "derbies",
      "black",
      "solid",
      "leather",
      2,
      4,
      ["spring", "summer", "fall", "winter"],
      ["work", "dinner", "formal"],
      2,
      "2026-04-05T18:00:00.000Z"
    )
  ];
}

function seedItem(
  id: WardrobeItem["id"],
  name: WardrobeItem["name"],
  category: WardrobeItem["category"],
  subcategory: WardrobeItem["subcategory"],
  primaryColor: WardrobeItem["primaryColor"],
  pattern: WardrobeItem["pattern"],
  material: WardrobeItem["material"],
  warmth: WardrobeItem["warmth"],
  formality: WardrobeItem["formality"],
  seasons: WardrobeItem["seasons"],
  occasions: WardrobeItem["occasions"],
  wearCount: WardrobeItem["wearCount"],
  lastWornAt: WardrobeItem["lastWornAt"]
): WardrobeItem {
  const item: WardrobeItem = {
    id,
    name,
    category,
    subcategory,
    primaryColor,
    secondaryColor: null,
    pattern,
    material,
    warmth,
    formality,
    seasons,
    occasions,
    wearCount,
    lastWornAt,
    fitNotes: "",
    status: "active",
    brand: "",
    processingStatus: "ready",
    createdAt: "2026-04-01T08:00:00.000Z",
    updatedAt: lastWornAt || "2026-04-01T08:00:00.000Z"
  };
  item.imageData = createPlaceholderImage(item);
  return item;
}
