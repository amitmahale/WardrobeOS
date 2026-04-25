import type { ColorFamily, ItemCategory, Occasion, Season } from "@/lib/types";

export type TagSuggestion = {
  name?: string;
  category?: ItemCategory;
  subcategory?: string;
  primaryColor?: ColorFamily;
  pattern?: string;
  material?: string;
  warmth?: number;
  formality?: number;
  seasons?: Season[];
  occasions?: Occasion[];
  fitNotes?: string;
};

const prompt = `Analyze this clothing image for a wardrobe catalog.
Return only compact JSON with these optional fields:
name, category, subcategory, primaryColor, pattern, material, warmth, formality, seasons, occasions, fitNotes.
Allowed categories: top, bottom, layer, outerwear, shoes.
Allowed colors: navy, white, cream, charcoal, olive, tan, khaki, black, blue, burgundy, brown, gray, camel, green.
Allowed seasons: spring, summer, fall, winter.
Allowed occasions: casual, smart-casual, work, dinner, travel, formal.
warmth and formality must be integers from 1 to 5.
Use practical tags, not fashion marketing copy.`;

const bulkPrompt = `Analyze these clothing images for a wardrobe catalog.
Return only compact JSON in this exact shape:
{"items":[{"id":"the provided image id","suggestions":{"name":"...","category":"top","subcategory":"...","primaryColor":"navy","pattern":"solid","material":"cotton","warmth":2,"formality":3,"seasons":["spring"],"occasions":["casual"],"fitNotes":"..."}}]}
Allowed categories: top, bottom, layer, outerwear, shoes.
Allowed colors: navy, white, cream, charcoal, olive, tan, khaki, black, blue, burgundy, brown, gray, camel, green.
Allowed seasons: spring, summer, fall, winter.
Allowed occasions: casual, smart-casual, work, dinner, travel, formal.
warmth and formality must be integers from 1 to 5.
Use practical tags, not fashion marketing copy. Keep every item tied to the provided id.`;

export async function suggestItemTagsFromImage(imageData: string): Promise<{
  provider: "gemini";
  suggestions: TagSuggestion;
}> {
  if (process.env.NEXT_PUBLIC_ENABLE_AI_TAGGING !== "true") {
    throw new Error("AI tagging is disabled.");
  }

  const provider = process.env.AI_TAGGING_PROVIDER || "gemini";
  if (provider !== "gemini") {
    throw new Error(`AI tagging provider '${provider}' is not implemented. Use AI_TAGGING_PROVIDER=gemini.`);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.includes("PASTE_")) {
    throw new Error("Gemini API key is not configured.");
  }

  const { mimeType, base64 } = parseDataUrl(imageData);
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64
              }
            },
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: "application/json"
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini tagging failed: ${response.status} ${detail.slice(0, 180)}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "{}";
  return {
    provider: "gemini",
    suggestions: normalizeSuggestions(parseJson(text))
  };
}

export async function suggestBulkItemTagsFromImages(
  images: Array<{ id: string; imageData: string; filename?: string | null }>
): Promise<{
  provider: "gemini";
  results: Array<{ id: string; suggestions: TagSuggestion }>;
}> {
  if (process.env.NEXT_PUBLIC_ENABLE_AI_TAGGING !== "true") {
    throw new Error("AI tagging is disabled.");
  }

  const provider = process.env.AI_TAGGING_PROVIDER || "gemini";
  if (provider !== "gemini") {
    throw new Error(`AI tagging provider '${provider}' is not implemented. Use AI_TAGGING_PROVIDER=gemini.`);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.includes("PASTE_")) {
    throw new Error("Gemini API key is not configured.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const parts = [
    { text: bulkPrompt },
    ...images.flatMap((image, index) => {
      const { mimeType, base64 } = parseDataUrl(image.imageData);
      return [
        { text: `Image ${index + 1}: id=${image.id}; filename=${image.filename || "unknown"}` },
        {
          inline_data: {
            mime_type: mimeType,
            data: base64
          }
        }
      ];
    })
  ];

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: "application/json"
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini bulk tagging failed: ${response.status} ${detail.slice(0, 180)}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "{}";
  return {
    provider: "gemini",
    results: normalizeBulkSuggestions(parseJson(text), images)
  };
}

function parseDataUrl(value: string) {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) throw new Error("Invalid image data.");
  return { mimeType: match[1], base64: match[2] };
}

function parseJson(text: string) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

function normalizeSuggestions(raw: Record<string, unknown>): TagSuggestion {
  return {
    name: stringValue(raw.name),
    category: oneOf(raw.category, ["top", "bottom", "layer", "outerwear", "shoes"]),
    subcategory: stringValue(raw.subcategory),
    primaryColor: oneOf(raw.primaryColor, [
      "navy",
      "white",
      "cream",
      "charcoal",
      "olive",
      "tan",
      "khaki",
      "black",
      "blue",
      "burgundy",
      "brown",
      "gray",
      "camel",
      "green"
    ]),
    pattern: stringValue(raw.pattern),
    material: stringValue(raw.material),
    warmth: numberRange(raw.warmth, 1, 5),
    formality: numberRange(raw.formality, 1, 5),
    seasons: arrayOf(raw.seasons, ["spring", "summer", "fall", "winter"]),
    occasions: arrayOf(raw.occasions, ["casual", "smart-casual", "work", "dinner", "travel", "formal"]),
    fitNotes: stringValue(raw.fitNotes)
  };
}

function normalizeBulkSuggestions(raw: unknown, images: Array<{ id: string }>) {
  const payload = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const items = Array.isArray(payload.items) ? payload.items : Array.isArray(raw) ? raw : [];

  return images.map((image, index) => {
    const entry =
      items.find((candidate) => {
        if (!candidate || typeof candidate !== "object") return false;
        return (candidate as Record<string, unknown>).id === image.id;
      }) || items[index];
    const entryObject = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    const rawSuggestions =
      entryObject.suggestions && typeof entryObject.suggestions === "object"
        ? (entryObject.suggestions as Record<string, unknown>)
        : entryObject;
    return { id: image.id, suggestions: normalizeSuggestions(rawSuggestions) };
  });
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberRange(value: unknown, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function oneOf<const T extends string>(value: unknown, allowed: readonly T[]) {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : undefined;
}

function arrayOf<const T extends string>(value: unknown, allowed: readonly T[]) {
  if (!Array.isArray(value)) return undefined;
  return value.filter((entry): entry is T => typeof entry === "string" && allowed.includes(entry as T));
}
