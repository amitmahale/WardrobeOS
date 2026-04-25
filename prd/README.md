# Wardrobe OS — build handoff package

This package is designed so you can hand it to Codex or an engineer and get a production-grade MVP built with minimal back-and-forth.

## What is inside

- `docs/PRD.md` — detailed MVP product requirements document
- `docs/CODEX_HANDOFF.md` — direct implementation brief for Codex
- `docs/ARCHITECTURE.md` — stack, image storage, processing, security, deployment
- `docs/API_SPEC.md` — API request/response contracts
- `docs/DB_SCHEMA.sql` — initial Postgres schema with Supabase-friendly RLS notes
- `docs/DESIGN_SYSTEM.md` — UI system, layout rules, tokens, components
- `docs/USER_FLOWS.md` — screen-by-screen flow details
- `docs/WEDGE_FEATURES.md` — strategic differentiation and rollout order
- `docs/IMPLEMENTATION_PLAN.md` — sprint plan and build sequencing
- `docs/QA_ACCEPTANCE.md` — acceptance criteria and test scenarios
- `docs/prompt-for-codex.txt` — copy/paste starter prompt for Codex
- `wireframes/` — professional PNG wireframes and flow/architecture diagrams
- `prototype/` — working static prototype with local persistence and image upload

## Fastest way to use this package

1. Read `docs/PRD.md`
2. Read `docs/CODEX_HANDOFF.md`
3. Give `docs/prompt-for-codex.txt` to Codex along with the `docs/` folder
4. Open `prototype/index.html` to review flows and visual direction
5. Use `wireframes/` to align UI polish and page structure

## Prototype

The prototype is intentionally framework-free so it can run by simply opening `prototype/index.html`.

What works in the prototype:
- dashboard with wardrobe stats
- closet catalog with filters
- add item flow with image upload preview
- client-side image compression + dominant color suggestion
- outfit recommendation engine
- “buy next” unlock analysis
- packing planner
- local persistence using browser storage

What the prototype does **not** do:
- real auth
- real cloud storage
- real database
- server-side image jobs
- AI auto-tagging against a live model

Those are specified in the docs for the production build.

## Recommended production stack

The handoff assumes:
- Next.js App Router + TypeScript
- Tailwind + shadcn/ui
- Supabase Auth + Postgres + Storage
- optional OpenAI vision tagging behind a feature flag
- Vercel deployment for the web app

## Notes

This package is opinionated on purpose. It chooses a stack, data model, wedge features, and rollout order so Codex does not have to guess.