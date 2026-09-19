# Maliki Database

Maliki uses Supabase PostgreSQL as the future source of truth for users, catalog metadata, media references, and viewing activity. The schema is reproducible from `supabase/migrations/20260919000100_initial_schema.sql`; optional demo rows live in `supabase/seed.sql`.

## Relationships

- `profiles.id` references `auth.users.id`. A profile is created automatically when a Supabase Auth user is created.
- `content` stores public catalog metadata. `slug` is the stable URL key and `tmdb_id` is unique when present.
- `content.rating` stores the normalized TMDB vote average; it is metadata only and does not imply Maliki has streaming rights.
- `genres` stores normalized genre names. `content_genres` is the many-to-many join table between content and genres.
- `video_assets.content_id` references `content.id`. It stores provider playback identifiers and playback policy, never private provider credentials.
- `watchlists.user_id` references `auth.users.id` and is unique so each user has one default list.
- `watchlist_items` joins a watchlist to content and prevents duplicate saved titles per list.
- `watch_progress` stores one resumable position per user/content pair.
- `watch_history` stores timestamped viewing events for a user/content pair.

## Security model

RLS is enabled on every table. Published catalog rows, genres, published content relationships, and published video metadata can be read by anonymous and authenticated clients. Catalog and video writes require an authenticated user whose `app_metadata.role` JWT claim is `admin`.

User-owned tables are restricted with `auth.uid()`:

- Profiles can only be selected or changed by the matching user.
- Watchlists can only be managed by their owner.
- Watchlist items are allowed only when the referenced watchlist belongs to the current user.
- Watch progress and watch history can only be managed by the matching user.

The `public.is_admin()` helper reads `auth.jwt() -> app_metadata -> role`. Set that claim through a trusted server or Supabase Auth hook; do not accept admin role data from editable user metadata.

## Applying migrations

With the Supabase CLI installed and a project linked:

```text
supabase db push
supabase db seed
```

For a clean local database:

```text
supabase start
supabase db reset
```

The repository does not include a service-role key. Use the Supabase CLI or dashboard with administrative credentials to apply migrations. The browser receives only the project URL and anonymous key.

TMDB credentials belong only in the Edge Function environment (`TMDB_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`). They must not be added to `.env.example` as `VITE_` variables or imported by browser modules.

## Video playback

`video_assets` stores the Mux provider, playback ID, policy, duration, and readiness state. The browser never reads a playback ID directly for protected content. It calls the `authorize-playback` Edge Function with a Maliki `content_id`; the function verifies the authenticated user, resolves a ready Mux asset from the database, and returns a short-lived signed HLS URL. Configure `MUX_SIGNING_KEY_ID` and `MUX_SIGNING_KEY_SECRET` only as Edge Function secrets.

## Verification checklist

After applying the migration in a Supabase project:

1. Confirm all tables, foreign keys, indexes, triggers, and RLS flags in the Table Editor or `pg_catalog`.
2. As anonymous, select published content and confirm draft/archived content is hidden.
3. As two separate authenticated users, create profiles, watchlists, progress, and history rows. Confirm each user can read and mutate only their own rows.
4. Confirm an authenticated non-admin cannot insert, update, or delete catalog, genre, join, or video rows.
5. Confirm an admin JWT with `app_metadata.role = 'admin'` can manage catalog and video rows.

Actual cross-user RLS verification requires a configured Supabase project and two test auth users; it cannot be truthfully performed from this repository without credentials.
