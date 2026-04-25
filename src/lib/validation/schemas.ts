import { z } from "zod";
import { COLOR_FAMILIES } from "@/lib/types";

const colorSchema = z.enum(COLOR_FAMILIES);
const categorySchema = z.enum(["top", "bottom", "layer", "outerwear", "shoes"]);
const seasonSchema = z.enum(["all", "spring", "summer", "fall", "winter"]);
const occasionSchema = z.enum(["casual", "smart-casual", "work", "dinner", "travel", "formal"]);

export const itemSchema = z.object({
  name: z.string().min(1),
  category: categorySchema,
  subcategory: z.string().default(""),
  primaryColor: colorSchema,
  secondaryColor: colorSchema.nullish(),
  pattern: z.string().default("solid"),
  material: z.string().default("cotton"),
  warmth: z.coerce.number().min(1).max(5).default(2),
  formality: z.coerce.number().min(1).max(5).default(2),
  seasons: z.array(seasonSchema).min(1),
  occasions: z.array(occasionSchema).min(1),
  brand: z.string().nullish(),
  wearerProfileId: z.string().nullish(),
  status: z.enum(["active", "stored", "donated", "archived"]).default("active"),
  fitNotes: z.string().default("")
});

export const outfitQuerySchema = z.object({
  occasion: occasionSchema.default("work"),
  temperatureBand: z.enum(["hot", "mild", "cold"]).default("mild"),
  weather: z.enum(["dry", "windy", "rainy"]).default("dry"),
  dressLevel: occasionSchema.default("smart-casual"),
  includeItemIds: z.array(z.string()).default([]),
  excludeItemIds: z.array(z.string()).default([]),
  preferLeastWorn: z.boolean().default(true),
  freshnessBias: z.coerce.number().min(0).max(100).default(35)
});

export const purchaseQuerySchema = z.object({
  budgetTier: z.enum(["low", "medium", "high"]).default("medium"),
  targetOccasion: occasionSchema.default("smart-casual"),
  season: seasonSchema.default("all"),
  preferredCategory: z.union([categorySchema, z.literal("all")]).default("all"),
  preferredCategories: z.array(categorySchema).optional(),
  avoidDuplicates: z.boolean().default(true)
});

export const packQuerySchema = z.object({
  tripLengthDays: z.coerce.number().min(1).max(21).default(4),
  primaryOccasion: z.union([occasionSchema, z.literal("mixed")]).default("mixed"),
  primaryOccasions: z.array(occasionSchema).optional(),
  weather: z.enum(["hot", "mild", "cold"]).default("mild"),
  laundryAccess: z.boolean().default(false),
  shoeLimit: z.coerce.number().min(1).max(4).default(2)
});

export const feedbackSchema = z.object({
  targetType: z.enum(["outfit_recommendation", "purchase_recommendation"]),
  targetId: z.string().optional(),
  targetKey: z.string().optional(),
  feedback: z.enum(["thumbs_up", "thumbs_down", "saved", "wore", "dismissed"]),
  note: z.string().optional()
});

export const uploadUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"])
});

export const confirmUploadSchema = z.object({
  path: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.coerce.number().max(10 * 1024 * 1024)
});

export function zodError(error: z.ZodError) {
  return {
    error: {
      code: "invalid_request",
      message: "Request validation failed.",
      fields: Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), issue.message]))
    }
  };
}
