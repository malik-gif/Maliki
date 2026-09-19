import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const imageBase = 'https://image.tmdb.org/t/p/w780';
const backdropBase = 'https://image.tmdb.org/t/p/w1280';

function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } }); }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

async function authorize(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Authentication required.');
  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(url, anonKey);
  const { data, error } = await client.auth.getUser(token);
  if (error || data.user?.app_metadata?.role !== 'admin') throw new Error('Admin access required.');
  return data.user;
}

async function fetchTmdb(path: string, params: Record<string, string> = {}) {
  const apiKey = Deno.env.get('TMDB_API_KEY');
  if (!apiKey) throw new Error('TMDB_API_KEY is not configured on the server.');
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set('api_key', apiKey);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TMDB request failed (${response.status}).`);
  return response.json();
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  try {
    await authorize(request);
    const body = await request.json();
    const page = Number(body.page || 1);
    const discovery = await fetchTmdb('/discover/movie', { page: String(page), sort_by: body.sortBy || 'popularity.desc', with_genres: body.genreId ? String(body.genreId) : '' });
    const records = (discovery.results || []).map((movie: any) => ({ tmdb_id: movie.id, title: movie.title, slug: `${slugify(movie.title)}-${movie.id}`, content_type: 'movie', description: movie.overview || null, release_date: movie.release_date || null, poster_url: movie.poster_path ? `${imageBase}${movie.poster_path}` : null, backdrop_url: movie.backdrop_path ? `${backdropBase}${movie.backdrop_path}` : null, language: movie.original_language || 'en', rating: movie.vote_average || null, status: body.status || 'draft', featured: false }));
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: content, error } = await admin.from('content').upsert(records, { onConflict: 'tmdb_id' }).select('id,tmdb_id,title,slug');
    if (error) throw error;
    return json({ imported: content?.length || 0, page, content });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Content sync failed.' }, 403);
  }
});
