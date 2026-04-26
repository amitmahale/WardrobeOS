export type ItemCategory = "top" | "bottom" | "layer" | "outerwear" | "shoes";
export type ItemStatus = "active" | "stored" | "donated" | "archived";
export type Season = "spring" | "summer" | "fall" | "winter" | "all";
export type Occasion = "casual" | "smart-casual" | "work" | "dinner" | "travel" | "formal";
export type TemperatureBand = "hot" | "mild" | "cold";
export type Weather = "dry" | "windy" | "rainy";
export type BudgetTier = "low" | "medium" | "high";
export type Confidence = "low" | "medium" | "high";
export type FeedbackValue = "thumbs_up" | "thumbs_down" | "saved" | "wore" | "dismissed";
export type ClosetSort = "recent" | "wear-count" | "name" | "formality";
export type ClosetView = "grid" | "list";

export const COLOR_FAMILIES = [
  "navy",
  "white",
  "cream",
  "ivory",
  "beige",
  "stone",
  "taupe",
  "charcoal",
  "olive",
  "tan",
  "khaki",
  "black",
  "blue",
  "light-blue",
  "denim",
  "teal",
  "turquoise",
  "mint",
  "burgundy",
  "maroon",
  "brown",
  "gray",
  "camel",
  "green",
  "pink",
  "rose",
  "red",
  "coral",
  "orange",
  "rust",
  "yellow",
  "mustard",
  "purple",
  "lavender",
  "silver",
  "gold",
  "multi"
] as const;

export type ColorFamily = (typeof COLOR_FAMILIES)[number];

export type WardrobeItem = {
  id: string;
  name: string;
  category: ItemCategory;
  subcategory: string;
  primaryColor: ColorFamily;
  secondaryColor?: ColorFamily | null;
  pattern: string;
  material: string;
  warmth: number;
  formality: number;
  seasons: Season[];
  occasions: Occasion[];
  fitNotes: string;
  brand: string;
  imageData?: string | null;
  imageName?: string | null;
  processingStatus?: "pending" | "processing" | "ready" | "failed";
  wearCount: number;
  lastWornAt: string | null;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
};

export type ItemDraft = Omit<
  WardrobeItem,
  "id" | "wearCount" | "lastWornAt" | "status" | "createdAt" | "updatedAt" | "processingStatus"
> & {
  imageData?: string | null;
  imageName?: string | null;
};

export type OutfitQuery = {
  occasion: Occasion;
  temperatureBand: TemperatureBand;
  weather: Weather;
  dressLevel: Occasion;
  includeItemIds: string[];
  excludeItemIds: string[];
  preferLeastWorn: boolean;
  freshnessBias: number;
};

export type OutfitRecommendation = {
  key: string;
  id: string;
  items: WardrobeItem[];
  score: number;
  scoreBreakdown: {
    occasion: number;
    color: number;
    formality: number;
    weather: number;
    rotation: number;
  };
  substitutions: Array<{ replaceItemId: string; withItemId: string }>;
  rationale: string;
};

export type PurchaseCandidate = {
  key: string;
  name: string;
  category: ItemCategory;
  subcategory: string;
  primaryColor: ColorFamily;
  pattern: string;
  material: string;
  warmth: number;
  formality: number;
  seasons: Season[];
  occasions: Occasion[];
  priceBand: BudgetTier;
  metadata?: Record<string, string>;
};

export type BuyNextQuery = {
  budgetTier: BudgetTier;
  targetOccasion: Occasion;
  season: Season | "all";
  preferredCategory: ItemCategory | "all";
  avoidDuplicates: boolean;
};

export type PurchaseRecommendation = PurchaseCandidate & {
  unlockCount: number;
  coverageDelta: Partial<Record<Occasion, number>>;
  confidence: Confidence;
  reason: string;
  gapLabel: string;
  gapReason: string;
  gapSeverity: Confidence;
  candidateImageData: string;
  impactedItemIds: string[];
  impactedItems: string[];
  impactedItemPreviews: Array<Pick<WardrobeItem, "id" | "name" | "category" | "primaryColor" | "imageData">>;
  riskFlags: string[];
  score: number;
};

export type PackQuery = {
  tripLengthDays: number;
  primaryOccasion: Occasion | "mixed";
  weather: TemperatureBand;
  laundryAccess: boolean;
  shoeLimit: number;
};

export type PackPlan = {
  items: WardrobeItem[];
  outfitCount: number;
  note: string;
  counts: Record<ItemCategory, number>;
};

export type SavedOutfit = {
  id: string;
  key: string;
  name: string;
  itemIds: string[];
  occasion?: Occasion;
  createdAt: string;
};

export type SavedVisualization = {
  id: string;
  title: string;
  itemIds: string[];
  occasion?: Occasion | null;
  prompt: string;
  stylingNotes: string;
  imageUrl: string | null;
  imagePath: string | null;
  source: "chatgpt" | "wardrobeos";
  createdAt: string;
  items: Array<Pick<WardrobeItem, "id" | "name" | "category" | "primaryColor" | "imageData">>;
};

export type WearLogEntry = {
  id: string;
  itemIds: string[];
  source: "item" | "outfit" | "quick";
  outfitKey?: string;
  outfitName?: string;
  wornAt: string;
  createdAt: string;
};

export type FeedbackEvent = {
  id: string;
  targetType: "outfit_recommendation" | "purchase_recommendation";
  targetKey: string;
  feedback: FeedbackValue;
  note?: string;
  createdAt: string;
};

export type ClosetFilters = {
  search: string;
  category: ItemCategory | "all";
  color: ColorFamily | "all";
  occasion: Occasion | "all";
  season: Season | "all";
  sort: ClosetSort;
  view: ClosetView;
};

export type StyleProfile = {
  displayName: string;
  climate: string;
  defaultDressLevel: Occasion;
  favoriteColors: ColorFamily[];
  avoidedColors: ColorFamily[];
  shoppingPhilosophy: "minimalist" | "balanced" | "expressive" | "formal" | "casual";
  budgetBand: BudgetTier;
};
