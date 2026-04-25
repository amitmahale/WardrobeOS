# Wardrobe OS Build Checkpoint

## Current state

The PRD package has been turned into a working Next.js MVP.

- Public pages are implemented: `/`, `/features`, `/privacy`, `/terms`.
- App pages are implemented: `/app/dashboard`, `/app/closet`, `/app/items/new`, `/app/items/[id]`, `/app/outfits`, `/app/buy-next`, `/app/pack`, `/app/insights`, `/app/settings`.
- Local demo persistence is implemented with Zustand and browser local storage.
- Deterministic domain modules are implemented for outfit generation, outfit scoring, buy-next simulation, packing, coverage, duplicates, and underused items.
- API route handlers and Zod validation are implemented for the PRD contracts.
- Supabase-ready env template, helper clients, and SQL migration are included.
- Supabase migration has been verified against the project: `profiles` exists, purchase candidate seeds exist, and `item-images` bucket exists.
- Magic-link auth is implemented at `/login` with `/auth/callback`.
- Auth is now code-first for iPhone PWA reliability: the login page sends OTPs from the browser client and verifies the email code in the same app context.
- Expired, consumed, or cross-browser magic-link callbacks redirect back to `/login` with an actionable code-first recovery message.
- Password fallback is implemented on `/login` for accounts bootstrapped by the local service-role admin script.
- Admin auth bootstrap scripts are available: `npm run auth:otp -- user@example.com` and `npm run auth:password -- user@example.com`.
- Signed-in app sessions bootstrap a profile/default closet from Supabase.
- Add-item can upload public-obscure images to Supabase Storage and save metadata to Supabase.
- Bulk upload is implemented at `/app/items/bulk`: users can upload up to 50 photos, generate batch AI suggestions when signed in, review/correct each draft, and save accepted items.
- Bulk upload now has a resumable local review queue, per-image processing states, batch progress, status counts, and clear controls.
- Single-item and bulk intake now expose mobile camera capture with `capture="environment"` for the installed iPhone PWA.
- Dashboard wear tracking now includes quick "wore today" actions, a local wear log, and a 14-day activity strip.
- Gemini AI Studio tagging is implemented behind `AI_TAGGING_PROVIDER=gemini`, `GEMINI_API_KEY`, and `NEXT_PUBLIC_ENABLE_AI_TAGGING=true`.
- AI tagging endpoint requires a signed-in user.
- README setup and verification instructions are included.

## Verification

These commands pass:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright test
```

Additional live checks completed:

```text
Supabase schema: ok
item-images bucket: ok
Gemini key: ok
/api/bootstrap while signed out: 200 anonymous
/api/ai/tag-item while signed out: 401
Vercel production deployment: https://wardrobeos.vercel.app
Vercel public routes: /, /features, /manifest.webmanifest, /login return 200
Vercel protected route: /app/dashboard redirects to /login
Vercel browser smoke: landing and login render successfully
Vercel magic-link form: reaches Supabase; current response is email rate limit
Supabase generated OTP simulation: ok with anon `verifyOtp` using `type=email`
Focused PWA auth browser tests: 10 passed
Latest auth deployment: https://wardrobeos.vercel.app -> wardrobeos-1kuz0e3ni-mahaleamit-gmailcoms-projects.vercel.app
Password fallback live smoke: ok for configured admin user
QoL verification: full Playwright suite passed, 26 tests across desktop and mobile-sized Safari
Latest QoL deployment: https://wardrobeos.vercel.app -> wardrobeos-dkcr9jpjt-mahaleamit-gmailcoms-projects.vercel.app
QoL live smoke: public/protected routes ok, authenticated dashboard/camera/bulk checks ok
```

## Notes

The app is fully usable locally with seeded demo data. Production auth, database persistence, and private image storage require configuring Supabase env vars and wiring route handlers to Supabase-backed reads/writes.
