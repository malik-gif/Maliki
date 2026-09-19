# Maliki Project Status

## Release status
**STATUS: PRODUCTION MVP - RELEASE PREPARED, NOT YET DEPLOYED**

Last release audit: 2026-09-19.

Local Supabase browser configuration is now present in the ignored
`config.local.js` file for the supplied project. Production still requires the
same public values through the hosting environment; no server-only secret is
used by the browser.

- Production URL: **Not assigned**
- Deployment platform: **Netlify configuration added; no site linked from this workspace**
- Supabase project: **Not linked; production project reference required**
- Enabled integrations: Supabase Auth/Postgres/RLS, TMDB Edge Function proxy, Unsplash client service, Mux signed HLS authorization
- Production secrets: **Not present in the repository; configure through Netlify/Supabase environment settings**

## Current project state
Maliki is a dependency-free HTML, CSS, and JavaScript streaming frontend MVP. The existing cinematic UI remains intact and now loads through an ES module controller with service, state, component, page, data, and utility boundaries.

## Completed phases
- MVP visual shell and responsive design
- Demo catalog, content rails, browse filters, search, details, player, My List, history, profile, settings, mock authentication, and 404 route
- Local persistence for My List, watch history, and preferences
- ES module architecture and backend-ready service interfaces
- Browser regression pass for core routes and interactions

## Current phase
Release preparation: local production-readiness audit complete; external deployment pending.

## Architecture decisions
- Keep the app framework-free and preserve the existing static deployment model.
- Use `JS/app.js` as the route and event controller.
- Keep page markup in `JS/pages/pages.js` and reusable card, rail, modal, and toast markup in `JS/components/`.
- Keep demo catalog data in `JS/data/catalog.js` behind `JS/services/contentService.js`.
- Keep local persistence behind `JS/services/storageService.js` and state mutations in `JS/state/appState.js`.
- Isolate Supabase, TMDB, Unsplash, auth, and playback integrations in `JS/services/`.
- Use local demo fallbacks until environment variables and real API contracts are available.
- Keep the PostgreSQL source of truth in `supabase/migrations/` with optional demo rows in `supabase/seed.sql`.
- Keep RLS ownership checks in SQL and use `app_metadata.role = 'admin'` for trusted catalog administration.
- Use Supabase Auth session persistence and `onAuthStateChange`; passwords never enter localStorage or application state.
- Protect user-owned routes in the controller and render logged-in/logged-out navigation from the current session.
- Treat Supabase `content` as the catalog source when configured, with demo data only as a failure fallback.
- Keep TMDB credentials in Edge Functions; TMDB metadata never creates a playable asset by itself.
- Keep authenticated list, profile, progress, and history data in Supabase; localStorage is limited to non-sensitive display preferences.
- Use database content IDs for all user-owned records and enforce ownership through the existing RLS policies.
- Resolve playback by Maliki content ID through `authorize-playback`; never accept arbitrary browser playback IDs.
- Use short-lived Mux signed HLS URLs for protected assets and report player progress back to `watch_progress`.
- Use trusted Supabase Auth `app_metadata.role = 'admin'` for admin route visibility; database RLS remains the mutation authority.
- Keep the admin surface intentionally small: dashboard, searchable content table, create/edit form, publishing controls, and video asset association.
- Escape user/API text before rendering and validate remote URLs before HTML/CSS insertion.
- Keep auth, admin, playback, and database failure states visible instead of silently falling back to unrelated content.

## Known limitations
- Supabase schema and RLS policies are implemented in SQL, but the project has not been linked to a live Supabase instance.
- TMDB proxy and admin sync Edge Functions are defined but require deployed functions and server secrets.
- Unsplash retrieval is implemented with in-memory request caching and graceful fallback.
- Playback uses a secure Mux HLS path when an authorized asset is configured; no fallback stream is fabricated.
- Real authentication requires the public Supabase URL and anon/publishable key at runtime.
- My List, history, progress, and profile require a configured Supabase project; the logged-out app does not fake private data.
- Mux playback requires deployed Edge Functions, ready `video_assets` rows, and Mux signing secrets.
- Admin routes require an authenticated user with a trusted `app_metadata.role` claim; normal users receive a forbidden state.
- The current static server does not provide server-side route fallback; hash routing keeps direct browser navigation functional.
- Catalog metadata and images are demo content backed by remote Unsplash URLs.
- Live RLS, admin JWT, Mux, TMDB, and Supabase failure injection require deployed credentials and cannot be proven by the static fallback runtime.
- Demo fallback is limited to localhost or explicit `VITE_DEMO_MODE=true`; production hosts with missing Supabase configuration show a setup error.

## Environment variables
See `.env.example` for future configuration names:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_UNSPLASH_ACCESS_KEY`
- `VITE_DEMO_MODE` (development only; keep `false` in production)

No real secrets are stored in this repository.
For the static frontend, provide the same public values through the build environment or `window.MALIKI_CONFIG` before `JS/app.js` loads. Never provide a service-role key.

## Production release checklist
- [ ] Create/link production Supabase project
- [ ] Apply migrations and verify RLS in production
- [ ] Deploy `tmdb-proxy`, `content-sync`, and `authorize-playback`
- [ ] Configure TMDB, Mux, and Supabase Edge Function secrets
- [ ] Configure Supabase Auth Site URL and redirect URLs
- [ ] Create Netlify site, configure public environment variables, attach HTTPS domain
- [ ] Import/publish authorized catalog content and verify a ready Mux asset
- [ ] Run the documented end-to-end user, admin, and two-user security tests

The release checklist remains intentionally open until a production hosting account,
Supabase project, domain, authorized video asset, and service configuration are
available in the deployment environment.

## Post-MVP backlog
- Automated CI build, lint, migration, and browser smoke checks
- Observability and alerting for Edge Functions, playback, and database failures
- Automated content/video ingestion webhooks
- Production CDN/image transformation strategy
- Formal backup, restore, and rollback runbooks

## Acceptance status
- Existing UI and visual styling preserved: **Pass**
- Existing routes and interactions preserved: **Pass**
- Modular JavaScript architecture: **Pass**
- Framework migration avoided: **Pass**
- Avoidable browser console errors: **Pass**
- Backend-ready service seams: **Pass, placeholders only**
- Supabase schema and RLS migration: **Implemented, live-project verification pending**
- Real Supabase signup, login, logout, session listener, reset request, and password update: **Implemented, live credentials required for execution**
- Protected user routes and logged-in/logged-out navigation: **Pass**
- Plaintext password storage: **None**
- Database-backed content service and normalized TMDB sync path: **Implemented, live project and function deployment pending**
- TMDB full-length playback: **Intentionally not implemented**
- Database-backed My List, watch progress, history, and profile: **Implemented, live two-account verification pending**
- Search, genre filtering, and persisted progress rendering: **Pass locally; Supabase credentials required for live execution**
- Secure Mux authorization and HLS player: **Implemented, live Mux asset and Edge Function deployment pending**
- Protected admin dashboard/content CRUD: **Implemented, live admin JWT and Supabase verification pending**
- Public unpublished-content filtering: **Enforced by content RLS policy and public content service query**
- Production security audit: **Pass locally; no repository secrets found, unsafe dynamic text/media paths hardened**
- Release configuration and handoff: **Pass locally; `.gitignore`, Netlify headers, environment documentation, and deployment runbook are present**
- Production deployment and live end-to-end verification: **Blocked pending hosting, Supabase, domain, TMDB, Unsplash, and Mux access**
- Responsive matrix (320, 375, 390, 414, 768, 1024, 1280, 1440, 1920): **Pass, no horizontal overflow detected**
- Keyboard slash-search shortcut and protected-route navigation: **Pass**
- Live two-user RLS/admin/third-party failure verification: **Pending deployed environment**
- Production backend/auth/video integration: **Not yet in scope**
