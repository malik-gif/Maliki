insert into public.genres (name, slug)
values
  ('Drama', 'drama'),
  ('Sci-Fi', 'sci-fi'),
  ('Adventure', 'adventure'),
  ('Comedy', 'comedy'),
  ('Romance', 'romance')
on conflict (slug) do nothing;

insert into public.content (tmdb_id, title, slug, content_type, description, release_date, runtime, poster_url, backdrop_url, language, status, featured)
values
  (900001, 'Afterlight', 'afterlight', 'movie', 'After a city loses power for one long night, a radio producer traces a voice that may change how she sees home.', '2026-01-16', 108, 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=900&q=82', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2200&q=88', 'en', 'published', true),
  (900002, 'Saltwater Letters', 'saltwater-letters', 'movie', 'Two siblings return to the coastline where their family story began, carrying letters neither of them has read.', '2025-05-23', 96, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=82', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=82', 'en', 'published', false),
  (900003, 'Low Orbit', 'low-orbit', 'series', 'A quiet crew on the edge of the atmosphere discovers a signal with a memory of its own.', '2026-03-06', null, 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=82', 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=82', 'en', 'published', false)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  poster_url = excluded.poster_url,
  backdrop_url = excluded.backdrop_url,
  updated_at = timezone('utc', now());

insert into public.content_genres (content_id, genre_id)
select content.id, genres.id
from public.content
join public.genres on genres.slug = case content.slug
  when 'afterlight' then 'drama'
  when 'saltwater-letters' then 'drama'
  when 'low-orbit' then 'sci-fi'
end
where content.slug in ('afterlight', 'saltwater-letters', 'low-orbit')
on conflict do nothing;
