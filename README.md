# Wardrobe OS

Wardrobe OS is a practical wardrobe optimizer: catalog what you own, generate explainable outfits, surface underused items, plan trip capsules, and rank the single next purchase that unlocks the most outfits.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS with shadcn-style primitives
- Zustand local demo persistence
- Supabase-ready schema, clients, and env template
- Deterministic domain engines for outfits, buy-next, insights, and packing

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app works immediately with seeded local data in browser storage. Use Settings or the sidebar to reset the demo closet.

## Verification

```bash
npm run typecheck
npm test
npm run build
```

## Environment

Copy `.env.example` to `.env.local` when connecting production services.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_TAGGING_PROVIDER=gemini
GEMINI_MODEL=gemini-3.1-flash-lite-preview
GEMINI_API_KEY=
NEXT_PUBLIC_ENABLE_AI_TAGGING=false
GPT_ACTION_CLIENT_ID=wardrobeos-custom-gpt
GPT_ACTION_CLIENT_SECRET=
GPT_ACTION_TOKEN_SECRET=
```

## Supabase

Apply the initial schema from:

```text
supabase/migrations/0001_initial_schema.sql
supabase/migrations/0002_gpt_actions_oauth.sql
```

Use the Supabase SQL editor for this initial setup. See `supabase/README.md`.

The migration includes the PRD tables, RLS policies, and starter purchase candidate rows. Production image buckets should follow the PRD paths:

- `item-originals/{user_id}/{item_id}/{uuid}.jpg`
- `item-optimized/{user_id}/{item_id}/display.jpg`
- `item-optimized/{user_id}/{item_id}/thumb.jpg`

## Implemented MVP Surfaces

- Public pages: `/`, `/features`, `/privacy`, `/terms`
- App pages: `/app/dashboard`, `/app/closet`, `/app/items/new`, `/app/items/bulk`, `/app/items/[id]`
- Engines: `/app/outfits`, `/app/buy-next`, `/app/pack`, `/app/insights`
- Settings: style baseline, integration status, local data reset
- API contracts: item create, image upload placeholders, outfit recommendations, purchase recommendations, insights, pack, feedback
- Bulk intake: upload up to 50 photos, apply AI tag suggestions in one pass when signed in, review/correct drafts, and save accepted items

## Notes

The local demo intentionally does not require Supabase credentials. With Supabase configured, `/app/*` uses magic-link auth and bootstraps a default closet for the signed-in user.

## AI Tagging

AI tagging is optional and user-confirmed. Set:

```bash
AI_TAGGING_PROVIDER=gemini
GEMINI_API_KEY=...
NEXT_PUBLIC_ENABLE_AI_TAGGING=true
```

The add-item screen exposes “Suggest tags with AI” after an image is uploaded. If no Gemini key is configured, the app falls back to manual tagging and local dominant-color detection.

Bulk upload uses the same feature flag through `/api/ai/tag-items/bulk`. The review UI is available at `/app/items/bulk` and still works without AI by pre-filling drafts from filenames and local color estimation.

## Custom GPT Companion

WardrobeOS exposes a private-beta GPT Actions surface at `/api/gpt/openapi.json`. It lets a Custom GPT read a signed-in user's closet, create outfit suggestions, and produce visualization briefs while ChatGPT handles conversation and image generation with the user's own ChatGPT plan.

See `prd/docs/CUSTOM_GPT_COMPANION.md` for OAuth setup, required environment variables, and suggested GPT instructions.

Set `NEXT_PUBLIC_CUSTOM_GPT_URL` to the published GPT share URL, for example `https://chatgpt.com/g/g-...`, so `/app/gpt-stylist` opens the actual companion instead of the generic GPTs page. The launchpad copies the selected prompt before opening ChatGPT; ChatGPT GPT links open the GPT but do not reliably preload a new message from a third-party web app.

Saved visualizations are supported through the GPT Action `POST /api/gpt/visualizations`. When ChatGPT includes generated images in `openaiFileIdRefs`, WardrobeOS downloads the temporary image immediately, stores it in Supabase Storage, and renders it in `/app/visualizations`.

For a short end-to-end architecture walkthrough, see `prd/docs/APP_ARCHITECTURE_MAGAZINE.md`.

The designed magazine page is available locally at `/architecture-magazine`. Regenerate the polished PDF with:

```bash
npm run export:architecture-pdf
```

The exported PDF is served from `public/docs/wardrobeos-architecture-magazine.pdf`.

## iPhone PWA Login

Use an email-code-only Magic Link template for the installed PWA. Avoid including `{{ .ConfirmationURL }}` because email clients can pre-open the link and consume the token before the user enters the code.

```html
<h2>Your Wardrobe OS login code</h2>
<p>Enter this code in the app:</p>
<h1>{{ .Token }}</h1>
```

Supabase Auth URL settings for production:

```text
Site URL: https://wardrobeos.vercel.app
Redirect URL: https://wardrobeos.vercel.app/auth/callback
```

If a user sees an expired-token message, request a fresh code from the installed PWA and enter the email code manually instead of clicking an older email link.

## Admin Auth Bootstrap

When Supabase's default email sender is rate-limited, use the local service-role bootstrap script. This never exposes the service-role key to the browser.

Generate a one-time login code without sending email:

```bash
npm run auth:otp -- user@example.com
```

Create or reset a password without sending email:

```bash
npm run auth:password -- user@example.com
```

The password command writes credentials to `.admin-auth-<email>.txt`, which is gitignored. Use the password on `/login` under "Password fallback", then delete the file after storing the password safely.
