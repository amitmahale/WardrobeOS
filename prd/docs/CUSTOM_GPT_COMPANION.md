# WardrobeOS Custom GPT Companion

## Product Boundary

WardrobeOS remains the system of record for accounts, closet uploads, item metadata, saved outfits, and profile settings. The Custom GPT is a companion surface for conversational styling and visualization workflows.

The GPT should not recreate the web app. It should call WardrobeOS Actions only when it needs real closet context.

## Implemented API Surface

- `GET /api/gpt/openapi.json` exposes the Custom GPT Action schema.
- `GET /api/gpt/me` returns the signed-in user's profile and closet summary.
- `GET /api/gpt/closet` returns closet items with structured tags and image URLs.
- `GET /api/gpt/items/{id}` returns one closet item.
- `GET /api/gpt/outfits` returns saved outfits.
- `GET /api/gpt/outfit-suggestions` generates outfit ideas from existing closet tags.
- `POST /api/gpt/visualization-brief` creates a prompt brief for ChatGPT image generation using selected closet item IDs.
- `GET /api/gpt/visualizations` returns ChatGPT try-on visualizations saved back to WardrobeOS.
- `POST /api/gpt/visualizations` saves visualization metadata and any attached `openaiFileIdRefs` image into WardrobeOS.

## Auth Model

The integration uses OAuth authorization code flow for GPT Actions.

ChatGPT redirects the user to:

```text
https://wardrobeos.vercel.app/api/gpt/oauth/authorize
```

WardrobeOS verifies the user's Supabase session. If they are not signed in, they are sent to `/login` and returned to the OAuth authorization URL after login. WardrobeOS then issues a one-time code, and ChatGPT exchanges that code at:

```text
https://wardrobeos.vercel.app/api/gpt/oauth/token
```

Access tokens are short-lived signed bearer tokens. Refresh tokens are stored hashed in Supabase.

## Required Environment

```text
GPT_ACTION_CLIENT_ID=wardrobeos-custom-gpt
GPT_ACTION_CLIENT_SECRET=<strong random secret>
GPT_ACTION_TOKEN_SECRET=<strong random signing secret>
GPT_ACTION_ALLOWED_REDIRECT_ORIGINS=https://chat.openai.com,https://chatgpt.com
GPT_ACTION_ALLOWED_REDIRECT_URIS=
```

Use exact `GPT_ACTION_ALLOWED_REDIRECT_URIS` if ChatGPT provides a fixed callback URL during GPT setup. Otherwise the default origins allow ChatGPT callback URLs on `chat.openai.com` and `chatgpt.com`.

## Custom GPT Setup

1. Create a Custom GPT in ChatGPT.
2. Enable image generation/canvas capabilities as desired.
3. Add an Action by importing `https://wardrobeos.vercel.app/api/gpt/openapi.json`.
4. Configure OAuth with the client id and client secret from the WardrobeOS environment.
5. Use the authorization URL and token URL from the imported OpenAPI schema.
6. Keep instructions clear: WardrobeOS is the source of truth; generated try-on images are styling visualizations, not guaranteed fit previews.

## Suggested GPT Instructions

```text
You are WardrobeOS Stylist. Use WardrobeOS Actions to fetch the user's real closet before recommending outfits. Prefer items the user owns. When creating visualization prompts, call createVisualizationBrief with selected item IDs, then use the returned brief as the source of truth. Be clear that visualizations are styling previews, not exact garment transfer or tailoring guarantees.

When the user asks to save a generated try-on image, call saveChatGptVisualization. Include the selected WardrobeOS item IDs, the prompt, concise styling notes, and the generated image in openaiFileIdRefs when available. Ask for confirmation before saving.
```

## Privacy Notes

- The GPT receives only the data returned by the WardrobeOS GPT endpoints.
- Item image URLs are currently public because the product decision allows obscure public item images for the beta.
- User full-body photos should be uploaded directly in ChatGPT. Only generated visualization outputs are saved to WardrobeOS when the user explicitly asks.
- Rotate OAuth client secrets if a Custom GPT is deleted, shared incorrectly, or suspected compromised.
