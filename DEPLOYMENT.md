# Maliki Production Deployment

## Current state
The repository is a static HTML/CSS/JavaScript site and is configured for Netlify via `netlify.toml`. No production deployment has been executed from this workspace because no hosting or Supabase credentials are available.

## Frontend

1. Create a Netlify site from this repository.
2. Set the publish directory to the repository root. `netlify.toml` already supplies this setting.
3. Configure the public runtime values without committing them:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_UNSPLASH_ACCESS_KEY`
4. Add the final HTTPS custom domain in Netlify and enable the managed certificate.
5. Confirm `https://your-domain.example/#/` loads the application.

The frontend has no build step. Hash routing keeps direct application routes working on a static host.

## Supabase

1. Link the production project with the Supabase CLI.
2. Apply the migration and seed only when demo rows are desired:

```text
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase db seed
```

3. Deploy all functions:

```text
supabase functions deploy tmdb-proxy
supabase functions deploy content-sync
supabase functions deploy authorize-playback
```

4. Configure Edge Function secrets with the Supabase dashboard or CLI. Never put these in frontend variables:
   - `TMDB_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MUX_SIGNING_KEY_ID`
   - `MUX_SIGNING_KEY_SECRET`
5. Configure Supabase Auth Site URL to the final HTTPS domain and add the final domain to Additional Redirect URLs.
6. Set an administrator role through a trusted server/Auth Hook by writing `app_metadata.role = "admin"`. Do not set roles from editable user metadata or the browser.

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
