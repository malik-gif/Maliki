import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const baseUrl = 'https://api.themoviedb.org/3';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}

async function tmdb(path: string, params: Record<string, string> = {}) {
  const apiKey = Deno.env.get('TMDB_API_KEY');
  if (!apiKey) throw new Error('TMDB_API_KEY is not configured on the server.');
  const url = new URL(`${baseUrl}${path}`);
  url.searchParams.set('api_key', apiKey);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TMDB request failed (${response.status}).`);
  return response.json();
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  try {
    const body = await request.json();
    const action = body.action;
    if (action === 'discover') return json(await tmdb('/discover/movie', { page: String(body.page || 1), with_genres: body.genreId ? String(body.genreId) : '', sort_by: body.sortBy || 'popularity.desc' }));
    if (action === 'search') return json(await tmdb('/search/multi', { query: body.query, page: String(body.page || 1), include_adult: 'false' }));
    if (action === 'details') return json(await tmdb(`/movie/${encodeURIComponent(body.tmdbId)}`));
    if (action === 'genres') return json(await tmdb('/genre/movie/list'));
    if (action === 'credits') return json(await tmdb(`/movie/${encodeURIComponent(body.tmdbId)}/credits`));
    if (action === 'similar') return json(await tmdb(`/movie/${encodeURIComponent(body.tmdbId)}/similar`, { page: String(body.page || 1) }));
    if (action === 'videos') return json(await tmdb(`/movie/${encodeURIComponent(body.tmdbId)}/videos`));
    return json({ error: 'Unsupported TMDB action.' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'TMDB request failed.' }, 502);
  }
});
