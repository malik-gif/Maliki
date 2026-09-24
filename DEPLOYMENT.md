# Maliki Production Deployment

## Current state
The repository is a static HTML/CSS/JavaScript site. Vercel runs the small `vercel-build` script to generate `config.js` from public environment variables before serving the files.

## Frontend

1. Import this repository into Vercel and use the repository root as the project root.
2. Add these Environment Variables in Vercel for the **Production** environment:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_UNSPLASH_ACCESS_KEY`
3. Redeploy after adding or changing variables. Vercel injects them during the build; they are not read from `.env` at browser runtime.
4. Confirm `https://your-domain.example/#/` loads the application.

The Supabase URL and anon/publishable key are browser-safe. The Unsplash key is optional: catalog poster and backdrop URLs come from Supabase, while the key only enables the home-page editorial image enhancement.

The frontend has no bundling step; the Vercel build only writes the runtime config. Hash routing keeps direct application routes working on a static host.

## Supabase

1. Link the production project with the Supabase CLI.
2. Apply the migration:

```text
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

3. Add or import catalog rows and set their `status` to `published`. The public frontend deliberately returns no rows for draft or archived content. The included seed is optional demo content:

```text
supabase db seed
```

4. Deploy all functions:

```text
supabase functions deploy tmdb-proxy
supabase functions deploy content-sync
supabase functions deploy authorize-playback
```

5. Configure Edge Function secrets with the Supabase dashboard or CLI. Never put these in frontend variables:
   - `TMDB_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MUX_SIGNING_KEY_ID`
   - `MUX_SIGNING_KEY_SECRET`
6. Configure Supabase Auth Site URL to the final HTTPS domain and add the final domain to Additional Redirect URLs.
7. Set an administrator role through a trusted server/Auth Hook by writing `app_metadata.role = "admin"`. Do not set roles from editable user metadata or the browser.

## Production verification

- Anonymous catalog reads show only published content.
- Signup, email confirmation, login, reload, logout, and password reset work on the final domain.
- Two users cannot read or mutate each other's profile, list, progress, or history.
- Normal users receive no admin navigation and RLS rejects direct admin mutations.
- An admin can create, edit, publish, unpublish, and associate a ready video asset.
- Playback authorization rejects missing, unpublished, unready, or unauthorized assets.
- Mux playback returns short-lived signed HLS URLs only after authenticated authorization.
- Network failures show in-app error states and do not create console exceptions.

## Secrets policy

Only the Supabase URL, Supabase anon key, and Unsplash access key are browser-facing values. Service-role, TMDB, and Mux signing credentials belong exclusively to Supabase Edge Function secrets.
