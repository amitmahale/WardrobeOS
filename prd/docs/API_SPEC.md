# Wardrobe OS — API contracts

## Conventions

- All endpoints require auth except public pages.
- All responses use JSON.
- Errors follow a normalized envelope:
```json
{
  "error": {
    "code": "invalid_request",
    "message": "Human readable message",
    "fields": {
      "occasion": "Required"
    }
  }
}
```

## 1. Create item

`POST /api/items`

### Request
```json
{
  "name": "Navy Oxford Shirt",
  "category": "top",
  "subcategory": "oxford-shirt",
  "primaryColor": "navy",
  "secondaryColor": null,
  "pattern": "solid",
  "material": "cotton",
  "warmth": 2,
  "formality": 3,
  "seasons": ["spring", "fall", "winter"],
  "occasions": ["work", "smart-casual", "dinner"],
  "brand": null,
  "wearerProfileId": null,
  "status": "active",
  "fitNotes": "trim but comfortable"
}
```

### Response
```json
{
  "item": {
    "id": "itm_123",
    "name": "Navy Oxford Shirt",
    "category": "top",
    "createdAt": "2026-04-23T00:00:00.000Z"
  }
}
```

## 2. Request signed image upload URL

`POST /api/items/:id/image/upload-url`

### Request
```json
{
  "filename": "shirt.jpg",
  "contentType": "image/jpeg"
}
```

### Response
```json
{
  "uploadUrl": "https://...",
  "path": "item-originals/user_1/itm_123/uuid.jpg",
  "headers": {
    "content-type": "image/jpeg"
  },
  "expiresInSeconds": 7200
}
```

## 3. Confirm image upload

`POST /api/items/:id/image/confirm`

### Request
```json
{
  "path": "item-originals/user_1/itm_123/uuid.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 1834421
}
```

### Response
```json
{
  "image": {
    "id": "img_123",
    "status": "processing"
  }
}
```

## 4. Ask for outfit recommendations

`POST /api/recommend/outfits`

### Request
```json
{
  "occasion": "work",
  "temperatureBand": "mild",
  "weather": "dry",
  "dressLevel": "smart-casual",
  "includeItemIds": [],
  "excludeItemIds": [],
  "preferLeastWorn": true,
  "freshnessBias": 0.35
}
```

### Response
```json
{
  "query": {
    "occasion": "work",
    "temperatureBand": "mild"
  },
  "recommendations": [
    {
      "id": "outfit_rec_1",
      "score": 92,
      "rationale": "Balanced work look with strong color contrast and a light rotation boost.",
      "items": [
        {"id": "itm_top_1", "category": "top", "name": "Navy Oxford Shirt"},
        {"id": "itm_bottom_1", "category": "bottom", "name": "Charcoal Trousers"},
        {"id": "itm_layer_1", "category": "layer", "name": "Navy Blazer"},
        {"id": "itm_shoe_1", "category": "shoes", "name": "Brown Loafers"}
      ],
      "substitutions": [
        {"replaceItemId": "itm_layer_1", "withItemId": "itm_layer_2"}
      ],
      "scoreBreakdown": {
        "occasion": 26,
        "color": 22,
        "formality": 18,
        "weather": 12,
        "rotation": 14
      }
    }
  ]
}
```

## 5. Ask for purchase recommendations

`POST /api/recommend/purchases`

### Request
```json
{
  "budgetTier": "medium",
  "targetOccasion": "smart-casual",
  "season": "all",
  "preferredCategories": ["bottom", "shoes"],
  "avoidDuplicates": true
}
```

### Response
```json
{
  "recommendations": [
    {
      "candidateKey": "cream_trouser",
      "name": "Cream trousers",
      "category": "bottom",
      "unlockCount": 9,
      "coverageDelta": {
        "work": 4,
        "dinner": 3,
        "smart-casual": 2
      },
      "confidence": "high",
      "reason": "Pairs cleanly with five existing tops and two layers while improving warm-weather smart-casual coverage.",
      "impactedItemIds": ["itm_top_1", "itm_top_2", "itm_layer_1"],
      "riskFlags": []
    }
  ]
}
```

## 6. Get insights

`GET /api/insights`

### Response
```json
{
  "summary": {
    "activeItemCount": 34,
    "savedOutfitCount": 8,
    "underusedItemCount": 5
  },
  "occasionCoverage": [
    {"occasion": "casual", "score": 84},
    {"occasion": "work", "score": 71},
    {"occasion": "formal", "score": 28}
  ],
  "duplicates": [
    {
      "clusterKey": "navy-casual-top",
      "count": 4,
      "itemIds": ["itm1", "itm2", "itm3", "itm4"]
    }
  ],
  "underusedItems": [
    {
      "itemId": "itm_9",
      "name": "Olive overshirt",
      "wearCount": 1,
      "suggestedContexts": ["casual", "travel"]
    }
  ]
}
```

## 7. Generate packing plan

`POST /api/pack`

### Request
```json
{
  "tripLengthDays": 4,
  "primaryOccasions": ["casual", "dinner", "work"],
  "weather": "mild",
  "laundryAccess": false,
  "shoeLimit": 2
}
```

### Response
```json
{
  "packingList": [
    {"itemId": "itm_top_1"},
    {"itemId": "itm_top_2"},
    {"itemId": "itm_bottom_1"},
    {"itemId": "itm_layer_1"},
    {"itemId": "itm_shoe_1"}
  ],
  "outfitCount": 8,
  "note": "This capsule covers all requested occasions with one dressier and one casual footwear option."
}
```

## 8. Submit recommendation feedback

`POST /api/feedback`

### Request
```json
{
  "targetType": "outfit_recommendation",
  "targetId": "outfit_rec_1",
  "feedback": "thumbs_up",
  "note": "Good but a bit too formal"
}
```

### Response
```json
{
  "ok": true
}
```

## 9. Bulk tag item images

`POST /api/ai/tag-items/bulk`

Requires auth and AI tagging env vars. Accepts up to 50 client-compressed clothing images and returns editable tag suggestions. The UI must still require user review before saving.

### Request
```json
{
  "images": [
    {
      "id": "bulk_1",
      "filename": "navy-shirt.jpg",
      "imageData": "data:image/jpeg;base64,..."
    }
  ]
}
```

### Response
```json
{
  "provider": "gemini",
  "results": [
    {
      "id": "bulk_1",
      "suggestions": {
        "name": "Navy Oxford Shirt",
        "category": "top",
        "subcategory": "oxford-shirt",
        "primaryColor": "navy",
        "material": "cotton",
        "warmth": 2,
        "formality": 3,
        "seasons": ["spring", "fall"],
        "occasions": ["work", "smart-casual"]
      }
    }
  ]
}
```
