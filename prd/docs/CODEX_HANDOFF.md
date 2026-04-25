# Wardrobe OS — direct handoff for Codex

## Objective

Build a production-ready MVP for Wardrobe OS, a web app that helps users catalog clothing, generate outfits, surface underused items, and identify the best next purchase based on outfits unlocked.

## Hard requirements

- Use Next.js App Router and TypeScript.
- Use Tailwind CSS and shadcn/ui.
- Use Supabase for Auth, Postgres, and Storage.
- Use server-side validation with Zod.
- Enforce Row Level Security on user data.
- Keep recommendation logic deterministic and isolated in domain modules.
- Make AI image tagging optional behind a feature flag.
- Build a desktop-first app that is still responsive on mobile.
- Match the visual direction in the wireframes and prototype.

## Routes to implement

### Public
- `/`
- `/features`
- `/privacy`
- `/terms`

### Authenticated
- `/app/dashboard`
- `/app/closet`
- `/app/items/new`
- `/app/items/[id]`
- `/app/outfits`
- `/app/buy-next`
- `/app/pack`
- `/app/insights`
- `/app/settings`

## Major components

- AppShell
- SidebarNav
- StatCard
- FilterBar
- ItemCard
- ItemDetailPanel
- ImageUploader
- OutfitQueryForm
- OutfitRecommendationCard
- PurchaseRecommendationCard
- CoverageBars
- UnderusedItemCard
- PackPlanCard
- EmptyState
- ProcessingBadge

## Domain modules

- `lib/domain/colorCompatibility.ts`
- `lib/domain/formalityRules.ts`
- `lib/domain/occasionRules.ts`
- `lib/domain/seasonRules.ts`
- `lib/domain/outfitGenerator.ts`
- `lib/domain/outfitScorer.ts`
- `lib/domain/purchaseSimulator.ts`
- `lib/domain/packingPlanner.ts`

## Data model to implement

Read `DB_SCHEMA.sql`, then create typed data access layers for:
- profiles
- closets
- closet_members
- person_profiles
- items
- item_images
- saved_outfits
- saved_outfit_items
- recommendation_feedback
- closet_insight_snapshots
- purchase_candidate_library

## Upload flow to implement

1. Create item record.
2. Request signed upload URL from server.
3. Upload original image to private bucket.
4. Confirm upload.
5. Create image row.
6. Trigger image processing pipeline:
   - generate display derivative
   - generate thumb derivative
   - compute average color
   - optionally request AI tags
7. Show processing status in UI.
8. Require user confirmation of AI tags before final save if AI tags are used.

## Recommendation rules

### Outfit generator
- combine top + bottom + optional layer + optional shoes
- reject incompatible formality mismatches
- reject season mismatches
- score color compatibility with a simple explicit matrix
- prefer items that match requested occasion
- boost lower wear count when user requests rotation

### Buy-next engine
- use candidate library of archetypal purchases
- simulate addition of each candidate
- generate net new outfits
- return ranked list with reasons and duplicate risk flags

## UI expectations

- clean premium interface
- dark app shell with soft contrast
- strong page titles and structured cards
- clear explanations on every recommendation
- easy filters and obvious CTAs
- polished empty states

## Engineering expectations

- strict TypeScript
- reusable server/client boundaries
- domain logic unit tests
- seeded demo closet for local development
- no dead code
- no mock endpoints left behind in production code path
- clean README with setup instructions

## Definition of done

- local setup works from README
- auth works
- item CRUD works
- upload works
- outfit lab works with seeded data
- buy-next works with seeded data
- pack planner works
- insights page works
- responsive layout works
- tests cover domain logic