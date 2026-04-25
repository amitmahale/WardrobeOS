import type {
  BudgetTier,
  ItemCategory,
  ItemStatus,
  Occasion,
  PurchaseCandidate,
  Season
} from "@/lib/types";
import { COLOR_FAMILIES, type ColorFamily } from "@/lib/types";

export const COLOR_HEX: Record<ColorFamily, string> = {
  navy: "#243B63",
  white: "#ECEFF5",
  cream: "#E9DDC8",
  ivory: "#F4EAD5",
  beige: "#D7C2A0",
  stone: "#B8B1A4",
  taupe: "#8A786A",
  charcoal: "#3B4454",
  olive: "#596B3C",
  tan: "#B68C57",
  khaki: "#BAA175",
  black: "#16181C",
  blue: "#4F76B8",
  "light-blue": "#9AB9DD",
  denim: "#3F628A",
  teal: "#2F7D7E",
  turquoise: "#41A7A7",
  mint: "#A7D8C3",
  burgundy: "#7E2E43",
  maroon: "#5E2431",
  brown: "#6B4B34",
  gray: "#9BA4B4",
  camel: "#C8A16B",
  green: "#4B7A63",
  pink: "#E58AA7",
  rose: "#C96B83",
  red: "#B43A3A",
  coral: "#E87961",
  orange: "#D7772D",
  rust: "#A8552A",
  yellow: "#E2C84B",
  mustard: "#C49A2C",
  purple: "#6E4A8E",
  lavender: "#B6A0D8",
  silver: "#C8CDD3",
  gold: "#C9A44C",
  multi: "#8D6EBD"
};

export const COLOR_NAMES = [...COLOR_FAMILIES];

export const OCCASIONS: Occasion[] = ["casual", "smart-casual", "work", "dinner", "travel", "formal"];
export const SEASONS: Season[] = ["spring", "summer", "fall", "winter"];
export const ITEM_CATEGORIES: ItemCategory[] = ["top", "bottom", "layer", "outerwear", "shoes"];
export const ITEM_STATUSES: ItemStatus[] = ["active", "stored", "donated", "archived"];
export const BUDGET_TIERS: BudgetTier[] = ["low", "medium", "high"];

export const CATEGORY_OPTIONS: Array<{ value: ItemCategory; label: string }> = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "layer", label: "Layer" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" }
];

export const DRESS_LEVEL_TO_FORMALITY: Record<Occasion, number> = {
  casual: 2,
  "smart-casual": 3,
  work: 3,
  dinner: 3,
  travel: 2,
  formal: 5
};

export const PURCHASE_CANDIDATES: PurchaseCandidate[] = [
  {
    key: "cream_trouser",
    name: "Cream trousers",
    category: "bottom",
    subcategory: "trousers",
    primaryColor: "cream",
    pattern: "solid",
    material: "cotton",
    warmth: 2,
    formality: 3,
    seasons: ["spring", "summer", "fall"],
    occasions: ["smart-casual", "work", "dinner"],
    priceBand: "medium",
    metadata: { style: "bridge" }
  },
  {
    key: "olive_chino",
    name: "Olive chinos",
    category: "bottom",
    subcategory: "chinos",
    primaryColor: "olive",
    pattern: "solid",
    material: "cotton",
    warmth: 2,
    formality: 2,
    seasons: ["spring", "fall"],
    occasions: ["casual", "smart-casual", "travel"],
    priceBand: "medium",
    metadata: { style: "bridge" }
  },
  {
    key: "white_ocbd",
    name: "White OCBD",
    category: "top",
    subcategory: "button-down-shirt",
    primaryColor: "white",
    pattern: "solid",
    material: "cotton",
    warmth: 2,
    formality: 3,
    seasons: ["spring", "summer", "fall", "winter"],
    occasions: ["work", "smart-casual", "dinner"],
    priceBand: "medium",
    metadata: { style: "staple" }
  },
  {
    key: "brown_suede_loafers",
    name: "Brown suede loafers",
    category: "shoes",
    subcategory: "loafers",
    primaryColor: "brown",
    pattern: "solid",
    material: "suede",
    warmth: 2,
    formality: 3,
    seasons: ["spring", "summer", "fall"],
    occasions: ["smart-casual", "dinner", "work"],
    priceBand: "medium",
    metadata: { style: "upgrade" }
  },
  {
    key: "charcoal_merino_crewneck",
    name: "Charcoal merino crewneck",
    category: "layer",
    subcategory: "sweater",
    primaryColor: "charcoal",
    pattern: "solid",
    material: "merino",
    warmth: 3,
    formality: 3,
    seasons: ["fall", "winter", "spring"],
    occasions: ["work", "smart-casual", "travel"],
    priceBand: "medium",
    metadata: { style: "staple" }
  },
  {
    key: "minimal_black_sneakers",
    name: "Minimal black sneakers",
    category: "shoes",
    subcategory: "sneakers",
    primaryColor: "black",
    pattern: "solid",
    material: "leather",
    warmth: 2,
    formality: 2,
    seasons: ["spring", "fall", "winter"],
    occasions: ["casual", "travel", "smart-casual"],
    priceBand: "medium",
    metadata: { style: "staple" }
  },
  {
    key: "unstructured_navy_blazer",
    name: "Unstructured navy blazer",
    category: "layer",
    subcategory: "blazer",
    primaryColor: "navy",
    pattern: "solid",
    material: "wool-blend",
    warmth: 3,
    formality: 4,
    seasons: ["spring", "fall", "winter"],
    occasions: ["work", "dinner", "smart-casual"],
    priceBand: "high",
    metadata: { style: "upgrade" }
  },
  {
    key: "midwash_jeans",
    name: "Mid-wash straight jeans",
    category: "bottom",
    subcategory: "jeans",
    primaryColor: "blue",
    pattern: "solid",
    material: "denim",
    warmth: 2,
    formality: 1,
    seasons: ["all"],
    occasions: ["casual", "travel", "dinner"],
    priceBand: "medium",
    metadata: { style: "casual-anchor" }
  },
  {
    key: "waterproof_mac",
    name: "Light waterproof mac",
    category: "outerwear",
    subcategory: "raincoat",
    primaryColor: "olive",
    pattern: "solid",
    material: "technical-cotton",
    warmth: 2,
    formality: 3,
    seasons: ["spring", "fall"],
    occasions: ["work", "travel", "smart-casual"],
    priceBand: "high",
    metadata: { style: "weather-gap" }
  },
  {
    key: "gray_flannel_trouser",
    name: "Gray flannel trousers",
    category: "bottom",
    subcategory: "trousers",
    primaryColor: "gray",
    pattern: "solid",
    material: "wool",
    warmth: 3,
    formality: 4,
    seasons: ["fall", "winter", "spring"],
    occasions: ["work", "dinner", "formal"],
    priceBand: "high",
    metadata: { style: "formal-coverage" }
  }
];
