# WardrobeOS Architecture

_A wardrobe operating system with a focused web app, a practical backend, and a ChatGPT companion that turns closet data into styling intelligence._

## The Big Picture

WardrobeOS is split into two clear product surfaces. The web app is the system of record: it owns accounts, closet intake, item metadata, saved outfits, preferences, and operational workflows. The ChatGPT companion is the creative layer: it reads the closet through secure Actions, helps style outfits conversationally, and uses the user's own ChatGPT image capabilities for visual try-on style previews.

This boundary keeps the app fast, private, and affordable while still making the AI experience feel rich.

```text
User
  -> WardrobeOS Web App
       -> Supabase Auth / Postgres / Storage
       -> Gemini tagging
       -> Vercel Route Handlers

User
  -> WardrobeOS Custom GPT
       -> OAuth into WardrobeOS
       -> GPT Actions read closet data
       -> ChatGPT image generation for visualization
```

## Product Surfaces

### WardrobeOS Web App

The web app is where users manage the wardrobe. It handles the durable, structured work:

- Sign in with magic-code email or password fallback.
- Add one item with camera or library upload.
- Bulk upload many photos, tag them with AI, review, correct, and save.
- Browse, filter, update, archive, and mark items worn.
- Generate outfit ideas, packing lists, purchase suggestions, and closet insights.
- Install as a PWA on iPhone for quick capture.

### Custom GPT Companion

The Custom GPT does not recreate the web app. It is a stylist that uses WardrobeOS as context:

- Fetch the user's active closet.
- Understand item tags, colors, formality, seasons, and occasions.
- Recommend outfits conversationally.
- Create visualization briefs from selected closet item IDs.
- Use ChatGPT image generation against a user-uploaded full-length photo.

The cost advantage is important: WardrobeOS does not pay for OpenAI image generation inside the app. Users who already have ChatGPT image access can use that capability directly in ChatGPT.

## Frontend Architecture

WardrobeOS uses Next.js App Router with TypeScript and Tailwind. The app is organized around a small set of focused surfaces:

- `/app/dashboard`: summary, quick wear logging, recent activity.
- `/app/closet`: catalog search, filters, list/grid views.
- `/app/items/new`: single-item capture and AI tagging.
- `/app/items/bulk`: 50-photo intake, AI tagging, review queue.
- `/app/outfits`: explainable outfit generation.
- `/app/buy-next`: next-purchase simulation.
- `/app/pack`: trip capsule planning.
- `/app/insights`: gaps, duplicates, underused items.
- `/app/settings`: style profile and integration status.

Client state uses Zustand for fast local interaction and PWA resilience. When Supabase is available, the app hydrates real closet data from the backend, while still keeping UI interactions responsive.

## Backend Architecture

The backend is implemented with Next.js Route Handlers on Vercel. These routes provide the server boundary for auth checks, validation, storage access, AI calls, and database writes.

Core API groups:

- `/api/bootstrap`: hydrate signed-in user, default closet, and items.
- `/api/items/*`: create, update, archive, mark worn, image upload.
- `/api/ai/*`: Gemini item tagging and bulk tagging.
- `/api/outfits`: save generated outfits.
- `/api/recommend/*`: deterministic outfit and purchase recommendations.
- `/api/pack`: packing planner output.
- `/api/feedback`: recommendation feedback capture.
- `/api/gpt/*`: Custom GPT OAuth and read-only Actions.

Server-side validation uses Zod. Supabase service-role access is only used in server routes, never in the browser.

## Data And Storage

Supabase provides Auth, Postgres, Row Level Security, and Storage.

Primary tables:

- `profiles`: user identity and style baseline.
- `closets`: default closet per user.
- `closet_members`: membership and future household sharing model.
- `items`: normalized wardrobe item metadata.
- `item_images`: storage paths and processing status.
- `saved_outfits`: saved outfit shells.
- `saved_outfit_items`: outfit item joins.
- `recommendation_feedback`: user response signals.
- `gpt_oauth_codes`: short-lived GPT authorization codes.
- `gpt_oauth_refresh_tokens`: hashed GPT refresh tokens.

Storage currently uses the `item-images` bucket. For the private beta, item images are public/obscure URLs by product decision, which keeps the GPT visual reference path simple. The schema still leaves room for signed URLs later.

## Recommendation Engine

The outfit intelligence starts deterministic, not magical. Domain modules score real items using stable rules:

- Color compatibility.
- Occasion fit.
- Season and weather fit.
- Formality match.
- Rotation and underuse.
- Purchase unlock simulation.
- Packing constraints.

This makes recommendations explainable. AI is used for tagging and language/visualization help, not as the source of truth for ranking.

## AI Tagging

AI tagging uses Gemini through server-side endpoints:

- Single item: `/api/ai/tag-item`
- Bulk upload: `/api/ai/tag-items/bulk`

The current production model is `gemini-3.1-flash-lite-preview`, selected after comparison testing against `gemini-2.5-flash`. It performed well for bulk tagging, was faster, and fits the user's free-tier usage better.

AI output is always treated as a suggestion. Users review and correct tags before saving, especially in bulk upload.

## PWA And Mobile Capture

WardrobeOS is installable as an iPhone PWA. The mobile capture loop is:

1. Open installed app.
2. Take a clothing photo or pick from the library.
3. Compress and preview locally.
4. Estimate color locally.
5. Optionally apply AI tags.
6. Review and save.

Auth uses an email-code-first flow because iOS email apps and browsers can consume magic links outside the installed PWA. Password fallback exists for development and rate-limit recovery.

## ChatGPT Integration

The Custom GPT integration uses OAuth authorization code flow and GPT Actions.

Public schema:

```text
https://wardrobeos.vercel.app/api/gpt/openapi.json
```

OAuth endpoints:

```text
https://wardrobeos.vercel.app/api/gpt/oauth/authorize
https://wardrobeos.vercel.app/api/gpt/oauth/token
```

GPT Action endpoints:

- `getWardrobeProfile`: profile and closet summary.
- `listClosetItems`: active closet item list.
- `getClosetItem`: single item detail.
- `listSavedOutfits`: saved outfits.
- `suggestClosetOutfits`: deterministic outfit suggestions from closet tags.
- `createVisualizationBrief`: prompt-ready visualization brief for selected item IDs.

Access tokens are short-lived signed bearer tokens. Refresh tokens are stored hashed in Supabase. ChatGPT never receives Supabase credentials or the WardrobeOS service role key.

## Visualization Strategy

True virtual try-on is expensive and model-specific. WardrobeOS takes a more practical beta path:

- WardrobeOS stores and organizes closet truth.
- The GPT reads real closet items.
- The user uploads their full-length photo directly in ChatGPT.
- The GPT creates a styling visualization using ChatGPT image tools.

This is framed honestly as a styling preview, not guaranteed garment transfer or tailoring accuracy. That makes the feature useful now without pulling high-cost image generation into WardrobeOS infrastructure.

## Deployment Model

Production runs on:

- Vercel for Next.js, route handlers, and PWA assets.
- Supabase for Auth, Postgres, RLS, and Storage.
- Gemini API for item tagging.
- ChatGPT Custom GPT for companion styling and visualization.

Important production environment variables include Supabase keys, Gemini model/key, and GPT Action OAuth secrets. Secrets live in Vercel and local gitignored files only.

## Testing And Quality

Regression coverage includes:

- Lint and TypeScript checks.
- Unit tests for domain logic and GPT OAuth helpers.
- Production build verification.
- Playwright browser tests for public routes, protected auth redirects, dashboard, outfit lab, buy-next, pack planner, item creation, bulk upload, closet filtering, wear tracking, and the GPT OpenAPI schema.

The current philosophy is simple: every new feature should either be deterministic and testable, or wrapped in a review step when AI is involved.

## What This Enables Next

The architecture now supports three product lanes:

- Better wardrobe capture: faster bulk upload, cleaner review, richer metadata.
- Better wardrobe intelligence: more personal scoring, wear analytics, seasonal planning.
- Better AI companion workflows: styling chat, travel outfit planning, event prep, and visual outfit previews through ChatGPT.

The system of record stays WardrobeOS. The creative surface can expand through ChatGPT without turning the web app into an expensive image-generation product.
