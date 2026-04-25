import { NextResponse } from "next/server";
import { getGptOAuthConfig } from "@/lib/gpt/oauth";

export async function GET(request: Request) {
  const { siteOrigin } = getGptOAuthConfig(request);
  return NextResponse.json(buildOpenApiDocument(siteOrigin));
}

function buildOpenApiDocument(origin: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "WardrobeOS Custom GPT Actions",
      version: "0.1.0",
      description:
        "Read a user's WardrobeOS closet so ChatGPT can act as a wardrobe stylist and create visualization prompts using the user's ChatGPT image capabilities."
    },
    servers: [{ url: origin }],
    paths: {
      "/api/gpt/me": {
        get: {
          operationId: "getWardrobeProfile",
          summary: "Get the signed-in user's WardrobeOS profile and closet summary.",
          security: [{ OAuth2: ["closet:read"] }],
          responses: {
            "200": {
              description: "Wardrobe profile",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileResponse" } } }
            }
          }
        }
      },
      "/api/gpt/closet": {
        get: {
          operationId: "listClosetItems",
          summary: "List wardrobe items from the user's closet.",
          security: [{ OAuth2: ["closet:read"] }],
          parameters: [
            { name: "status", in: "query", schema: { type: "string", enum: ["active", "stored", "donated", "archived", "all"], default: "active" } },
            { name: "category", in: "query", schema: { $ref: "#/components/schemas/ItemCategory" } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 100 } }
          ],
          responses: {
            "200": {
              description: "Closet items",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ClosetResponse" } } }
            }
          }
        }
      },
      "/api/gpt/items/{id}": {
        get: {
          operationId: "getClosetItem",
          summary: "Get one wardrobe item by id.",
          security: [{ OAuth2: ["closet:read"] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": {
              description: "Wardrobe item",
              content: { "application/json": { schema: { type: "object", properties: { item: { $ref: "#/components/schemas/WardrobeItem" } } } } }
            }
          }
        }
      },
      "/api/gpt/outfits": {
        get: {
          operationId: "listSavedOutfits",
          summary: "List saved WardrobeOS outfits.",
          security: [{ OAuth2: ["outfits:read"] }],
          responses: {
            "200": {
              description: "Saved outfits",
              content: { "application/json": { schema: { $ref: "#/components/schemas/SavedOutfitsResponse" } } }
            }
          }
        }
      },
      "/api/gpt/outfit-suggestions": {
        get: {
          operationId: "suggestClosetOutfits",
          summary: "Generate outfit suggestions from the user's real closet tags.",
          security: [{ OAuth2: ["outfits:suggest"] }],
          parameters: [
            { name: "occasion", in: "query", schema: { $ref: "#/components/schemas/Occasion" } },
            { name: "dressLevel", in: "query", schema: { $ref: "#/components/schemas/Occasion" } },
            { name: "temperatureBand", in: "query", schema: { type: "string", enum: ["hot", "mild", "cold"] } },
            { name: "weather", in: "query", schema: { type: "string", enum: ["dry", "windy", "rainy"] } },
            { name: "includeItemIds", in: "query", schema: { type: "string", description: "Comma-separated item ids to force include." } },
            { name: "excludeItemIds", in: "query", schema: { type: "string", description: "Comma-separated item ids to exclude." } },
            { name: "preferLeastWorn", in: "query", schema: { type: "boolean" } },
            { name: "freshnessBias", in: "query", schema: { type: "integer", minimum: 0, maximum: 100 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 12, default: 8 } }
          ],
          responses: {
            "200": {
              description: "Outfit suggestions",
              content: { "application/json": { schema: { $ref: "#/components/schemas/OutfitSuggestionsResponse" } } }
            }
          }
        }
      },
      "/api/gpt/visualization-brief": {
        post: {
          operationId: "createVisualizationBrief",
          summary: "Create a prompt brief for ChatGPT image generation using selected closet item ids.",
          security: [{ OAuth2: ["outfits:suggest"] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["itemIds"],
                  properties: {
                    itemIds: { type: "array", minItems: 1, maxItems: 8, items: { type: "string" } },
                    note: { type: "string", maxLength: 800 }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Visualization brief",
              content: { "application/json": { schema: { $ref: "#/components/schemas/VisualizationBrief" } } }
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        OAuth2: {
          type: "oauth2",
          flows: {
            authorizationCode: {
              authorizationUrl: `${origin}/api/gpt/oauth/authorize`,
              tokenUrl: `${origin}/api/gpt/oauth/token`,
              scopes: {
                "closet:read": "Read closet items and style profile.",
                "outfits:read": "Read saved outfits.",
                "outfits:suggest": "Generate outfit suggestions and visualization briefs."
              }
            }
          }
        }
      },
      schemas: {
        ItemCategory: { type: "string", enum: ["top", "bottom", "layer", "outerwear", "shoes"] },
        Occasion: { type: "string", enum: ["casual", "smart-casual", "work", "dinner", "travel", "formal"] },
        Closet: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" }
          }
        },
        ProfileResponse: {
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
                displayName: { type: ["string", "null"] },
                climate: { type: ["string", "null"] },
                defaultDressLevel: { type: ["string", "null"] }
              }
            },
            closet: {
              allOf: [
                { $ref: "#/components/schemas/Closet" },
                {
                  type: "object",
                  properties: {
                    activeItemCount: { type: "integer" },
                    totalItemCount: { type: "integer" }
                  }
                }
              ]
            }
          }
        },
        WardrobeItem: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            category: { $ref: "#/components/schemas/ItemCategory" },
            subcategory: { type: "string" },
            primaryColor: { type: "string" },
            secondaryColor: { type: ["string", "null"] },
            pattern: { type: "string" },
            material: { type: "string" },
            warmth: { type: "integer", minimum: 1, maximum: 5 },
            formality: { type: "integer", minimum: 1, maximum: 5 },
            seasons: { type: "array", items: { type: "string" } },
            occasions: { type: "array", items: { $ref: "#/components/schemas/Occasion" } },
            fitNotes: { type: "string" },
            brand: { type: "string" },
            imageUrl: { type: ["string", "null"], description: "Public or signed image URL suitable for GPT visual reference." },
            wearCount: { type: "integer" },
            lastWornAt: { type: ["string", "null"] },
            status: { type: "string" }
          }
        },
        ClosetResponse: {
          type: "object",
          properties: {
            closet: { $ref: "#/components/schemas/Closet" },
            count: { type: "integer" },
            items: { type: "array", items: { $ref: "#/components/schemas/WardrobeItem" } }
          }
        },
        SavedOutfit: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            itemIds: { type: "array", items: { type: "string" } },
            occasion: { type: ["string", "null"] },
            createdAt: { type: "string" },
            items: { type: "array", items: { $ref: "#/components/schemas/WardrobeItem" } }
          }
        },
        SavedOutfitsResponse: {
          type: "object",
          properties: {
            closet: { $ref: "#/components/schemas/Closet" },
            count: { type: "integer" },
            outfits: { type: "array", items: { $ref: "#/components/schemas/SavedOutfit" } }
          }
        },
        OutfitSuggestionsResponse: {
          type: "object",
          properties: {
            closet: { $ref: "#/components/schemas/Closet" },
            count: { type: "integer" },
            suggestions: { type: "array", items: { $ref: "#/components/schemas/SavedOutfit" } }
          }
        },
        VisualizationBrief: {
          type: "object",
          properties: {
            outfitName: { type: "string" },
            itemIds: { type: "array", items: { type: "string" } },
            items: { type: "array", items: { $ref: "#/components/schemas/WardrobeItem" } },
            visualizationPrompt: { type: "string" }
          }
        }
      }
    }
  };
}
