create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.content (
  id uuid primary key default gen_random_uuid(),
  tmdb_id bigint unique,
  title text not null,
  slug text not null unique,
  content_type text not null check (content_type in ('movie', 'series')),
  description text,
  release_date date,
  runtime integer check (runtime is null or runtime > 0),
  rating numeric(3,1) check (rating is null or (rating >= 0 and rating <= 10)),
  poster_url text,
  backdrop_url text,
  trailer_url text,
  language text not null default 'en',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.content_genres (
  content_id uuid not null references public.content(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  primary key (content_id, genre_id)
);

create table public.video_assets (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content(id) on delete cascade,
  provider text not null,
  playback_id text not null,
  playback_policy text not null default 'public' check (playback_policy in ('public', 'signed')),
  duration integer check (duration is null or duration >= 0),
  status text not null default 'processing' check (status in ('processing', 'ready', 'disabled', 'failed')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (provider, playback_id)
);

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  content_id uuid not null references public.content(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (watchlist_id, content_id)
);

create table public.watch_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.content(id) on delete cascade,
  position_seconds integer not null default 0 check (position_seconds >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, content_id)
);

create table public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.content(id) on delete cascade,
  watched_at timestamptz not null default timezone('utc', now())
);

create index content_status_featured_idx on public.content(status, featured);
create index content_release_date_idx on public.content(release_date desc);
create index content_genres_genre_id_idx on public.content_genres(genre_id);
create index video_assets_content_id_idx on public.video_assets(content_id);
create index watchlist_items_content_id_idx on public.watchlist_items(content_id);
create index watch_progress_user_updated_idx on public.watch_progress(user_id, updated_at desc);
create index watch_history_user_watched_idx on public.watch_history(user_id, watched_at desc);
create index watch_history_content_id_idx on public.watch_history(content_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger content_set_updated_at
before update on public.content
for each row execute function public.set_updated_at();

create trigger watch_progress_set_updated_at
before update on public.watch_progress
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  insert into public.watchlists (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.content enable row level security;
alter table public.genres enable row level security;
alter table public.content_genres enable row level security;
alter table public.video_assets enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.watch_progress enable row level security;
alter table public.watch_history enable row level security;

create policy "published content is public readable"
on public.content for select
to anon, authenticated
using (status = 'published' or public.is_admin());

create policy "published genres are public readable"
on public.genres for select
using (true);

create policy "published content genres are public readable"
on public.content_genres for select
using (exists (select 1 from public.content where content.id = content_id and (content.status = 'published' or public.is_admin())));

create policy "published video metadata is public readable"
on public.video_assets for select
using (exists (select 1 from public.content where content.id = content_id and (content.status = 'published' or public.is_admin())));

create policy "admins manage content"
on public.content for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage genres"
on public.genres for all
 to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage content genres"
on public.content_genres for all
 to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage video assets"
on public.video_assets for all
 to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "users read own profile"
on public.profiles for select
 to authenticated
using (auth.uid() = id);

create policy "users insert own profile"
on public.profiles for insert
 to authenticated
with check (auth.uid() = id);

create policy "users update own profile"
on public.profiles for update
 to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users manage own watchlist"
on public.watchlists for all
 to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage own watchlist items"
on public.watchlist_items for all
 to authenticated
using (exists (select 1 from public.watchlists where watchlists.id = watchlist_id and watchlists.user_id = auth.uid()))
with check (exists (select 1 from public.watchlists where watchlists.id = watchlist_id and watchlists.user_id = auth.uid()));

create policy "users manage own progress"
on public.watch_progress for all
 to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage own history"
on public.watch_history for all
 to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
