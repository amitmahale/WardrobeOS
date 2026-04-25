# Wardrobe OS — architecture and delivery plan

## 1. Recommended stack

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui component primitives
- React Hook Form + Zod
- TanStack Table for richer catalog views if needed later
- Zustand or URL/search params for local UI state only

### Backend
- Next.js Route Handlers and Server Actions
- Supabase for Auth, Postgres, Storage, Row Level Security
- optional Supabase Edge Functions for long-running or isolated jobs

### AI and image understanding
- Optional OpenAI vision tagging behind a feature flag
- Use model output only as a suggestion layer
- Never save inferred tags without user confirmation

### Hosting
- Vercel for the web app
- Supabase-managed database and storage

## 2. Why this stack

1. It minimizes glue code.
2. It keeps auth, database, and storage in one integrated backend.
3. It supports SSR cleanly for a polished web experience.
4. It leaves room for AI tagging without making the entire product depend on AI.
5. It is cheap and fast enough for an invite-only MVP.

## 3. Environment model

### Local
- Next.js app
- Supabase project or local Supabase stack
- `.env.local`

### Preview
- Vercel preview deployments
- shared staging Supabase project

### Production
- Vercel production
- production Supabase project
- background jobs behind feature flags if needed

## 4. App architecture

### Public surfaces
- landing pages
- auth pages
- static legal pages

### Authenticated surfaces
- dashboard
- closet
- item create/edit
- outfit lab
- buy next
- pack planner
- insights
- settings

### Service layers
1. `ui/` — layout and components
2. `lib/validation/` — Zod schemas
3. `lib/domain/` — scoring logic
4. `lib/storage/` — upload and URL helpers
5. `lib/recommendation/` — outfit and purchase engines
6. `app/api/` — API endpoints or route handlers
7. `supabase/` — schema, RLS, seeds, functions

## 5. Image storage and processing

## 5.1 MVP choice
Use Supabase Storage for:
- originals bucket
- display bucket or transformed derivative paths
- signed upload URLs when needed
- private object access

### Bucket structure
- `item-originals/{user_id}/{item_id}/{uuid}.jpg`
- `item-optimized/{user_id}/{item_id}/display.jpg`
- `item-optimized/{user_id}/{item_id}/thumb.jpg`

### Metadata stored in DB
- storage path
- mime type
- width
- height
- file size
- checksum
- background processing status
- AI suggestion status

## 5.2 Upload pipeline
1. Client asks server for an upload target.
2. Server creates item shell record in `items`.
3. Server creates signed upload URL or uploads via authenticated SDK.
4. Client uploads file directly.
5. Server stores image row in `item_images`.
6. Post-upload job:
   - validate type and size
   - generate optimized image
   - generate thumbnail
   - extract average color
   - optional AI tag suggestion
7. UI shows “processing” state until metadata is ready.

## 5.3 Production-safe rules
- accept JPEG, PNG, HEIC/WebP if conversion is supported
- enforce max original size, for example 10MB
- sanitize file names
- never trust client MIME type
- strip EXIF unless the product explicitly needs it
- keep originals private
- serve signed or policy-controlled URLs only

## 6. Recommendation engine architecture

### 6.1 Deterministic first
The recommendation engine is a pure domain layer that does not depend on the UI framework.

Modules:
- `color-compatibility.ts`
- `occasion-rules.ts`
- `season-rules.ts`
- `formality-rules.ts`
- `outfit-generator.ts`
- `outfit-scorer.ts`
- `purchase-simulator.ts`
- `packing-planner.ts`

### 6.2 Data shape
The domain model consumes normalized item data:
- category group
- color family
- season list
- occasion list
- formality level
- warmth
- pattern
- state flags

### 6.3 AI usage
Use AI only for:
- image tag suggestions
- plain-English rationale generation
- optional free-text occasion parsing

Do **not** use AI as the source of truth for core compatibility or ranking in MVP.

## 7. Background jobs

## MVP baseline
The product can launch without a queue by running light processing synchronously.

## Upgrade path
Move to background jobs when:
- upload volume rises
- image transforms take too long
- AI tagging latency hurts UX

Possible jobs:
- `process_item_image`
- `suggest_item_tags`
- `recompute_closet_insights`
- `recompute_purchase_candidates`

## 8. Security

- all app data scoped by `auth.uid()`
- private image buckets
- signed URLs when exposing direct object access
- RLS on every mutable table
- server-side validation of all write APIs
- rate limit image uploads and recommendation endpoints
- audit log later if household sharing is added

## 9. Suggested route map

- `GET /api/items`
- `POST /api/items`
- `PATCH /api/items/:id`
- `POST /api/items/:id/image/upload-url`
- `POST /api/items/:id/image/confirm`
- `POST /api/recommend/outfits`
- `POST /api/recommend/purchases`
- `GET /api/insights`
- `POST /api/pack`
- `POST /api/feedback`

## 10. Design and UX constraints

- desktop first, mobile good enough
- strong sidebar navigation in app shell
- dense information, but calm layout
- every recommendation card must have an explanation
- no buried filters
- upload flow must feel fast

## 11. Deployment notes

### Vercel
- deploy app and route handlers
- set environment variables for Supabase and OpenAI
- use preview deployments on PRs

### Supabase
- enable Auth
- create buckets
- apply schema and RLS
- seed demo data for development

## 12. Observability

Track:
- upload failures
- image processing latency
- AI tagging latency
- outfit recommendation latency
- buy-next computation latency
- top dismiss reasons

## 13. Future scaling decisions

When the product grows:
- move image derivation to dedicated background jobs
- consider Cloudflare R2 for lower-cost object storage if needed
- consider Cloudflare Images or another image layer for transformation and delivery
- precompute closet insight snapshots nightly
- cache recommendation runs by closet version hash

## 14. Official references to keep aligned with

- Next.js App Router docs
- Vercel Next.js deployment docs
- Supabase Auth SSR docs
- Supabase Storage docs
- Supabase signed upload URL docs
- OpenAI image/vision docs