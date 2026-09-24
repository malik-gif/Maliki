import { catalog, images } from '../data/catalog.js';
import { getSupabaseClient, isConfigured as isSupabaseConfigured } from './supabaseService.js';

const fallbackByGenre = new Map();
const imageFallbacks = [images.night, images.tide, images.city, images.desert, images.red, images.road, images.coast, images.portrait];
const viteEnv = import.meta.env || {};
const runtimeConfig = globalThis.MALIKI_CONFIG || {};

function demoFallbackEnabled() {
  const hasRuntimeSupabase = Boolean(runtimeConfig.supabaseUrl || runtimeConfig.supabaseAnonKey);
  const hasViteSupabase = Boolean(viteEnv.VITE_SUPABASE_URL || viteEnv.VITE_SUPABASE_ANON_KEY);
  return runtimeConfig.demoMode === true
    || viteEnv.VITE_DEMO_MODE === 'true'
    || ['localhost', '127.0.0.1'].includes(window.location.hostname)
    || (!hasRuntimeSupabase && !hasViteSupabase);
}

export function normalizeContent(row, index = 0) {
  const relationGenres = Array.isArray(row.content_genres) ? row.content_genres.map((relation) => relation.genres?.name || relation.genre?.name).filter(Boolean) : [];
  const genre = relationGenres[0] || row.genres?.[0]?.name || 'Featured';
  return { id: row.id, tmdbId: row.tmdb_id, title: row.title, type: row.content_type === 'movie' ? 'Film' : 'Series', year: row.release_date ? new Date(row.release_date).getUTCFullYear() : '', runtime: row.runtime ? `${Math.floor(row.runtime / 60)}h ${row.runtime % 60}m` : 'Series', durationSeconds: row.runtime || null, genre, genres: relationGenres, rating: row.rating || '—', image: row.poster_url || imageFallbacks[index % imageFallbacks.length], backdrop: row.backdrop_url || row.poster_url || imageFallbacks[index % imageFallbacks.length], trailer: row.trailer_url || null, description: row.description || 'More details are coming soon.', status: row.status, playable: Array.isArray(row.video_assets) && row.video_assets.some((asset) => asset.status === 'ready') };
}

async function queryContent({ id, genre } = {}) {
  const supabase = await getSupabaseClient();
  if (!supabase) return [];
  let query = supabase.from('content').select('*, content_genres(genres(name,slug)), video_assets(status)').eq('status', 'published').order('featured', { ascending: false }).order('release_date', { ascending: false });
  if (id) query = query.eq('id', id);
  const { data, error } = await query;
  if (error) throw new Error(error.message || 'Content request failed.');
  const rows = (data || []).map(normalizeContent);
  return genre && genre !== 'All' ? rows.filter((item) => item.genres.includes(genre) || item.genre === genre) : rows;
}

export async function getCatalog() {
  if (!isSupabaseConfigured()) return demoFallbackEnabled() ? catalog : [];
  try {
    const rows = await queryContent();
    return rows.length ? rows : demoFallbackEnabled() ? catalog : [];
  } catch {
    return demoFallbackEnabled() ? catalog : [];
  }
}

export async function getContentById(id) {
  if (!isSupabaseConfigured()) return demoFallbackEnabled() ? catalog.find((item) => item.id === id) || null : null;
  try {
    const rows = await queryContent({ id });
    return rows[0] || (demoFallbackEnabled() ? catalog.find((item) => item.id === id) || null : null);
  } catch {
    return demoFallbackEnabled() ? catalog.find((item) => item.id === id) || null : null;
  }
}

export async function searchContent(query) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  if (!isSupabaseConfigured()) return demoFallbackEnabled() ? catalog.filter((item) => `${item.title} ${item.genre} ${item.type} ${item.description}`.toLowerCase().includes(normalizedQuery.toLowerCase())) : [];
  try {
    const supabase = await getSupabaseClient();
    const filterQuery = normalizedQuery.replace(/[(),.*]/g, ' ');
    const { data, error } = await supabase.from('content').select('*, content_genres(genres(name,slug)), video_assets(status)').eq('status', 'published').or(`title.ilike.%${filterQuery}%,description.ilike.%${filterQuery}%`).limit(40);
    if (error) throw error;
    return (data || []).map(normalizeContent);
  } catch {
    return demoFallbackEnabled() ? catalog.filter((item) => `${item.title} ${item.genre} ${item.type} ${item.description}`.toLowerCase().includes(normalizedQuery.toLowerCase())) : [];
  }
}

export async function filterContent(genre) {
  if (fallbackByGenre.has(genre)) return fallbackByGenre.get(genre);
  if (!isSupabaseConfigured()) return demoFallbackEnabled() ? genre === 'All' ? catalog : catalog.filter((item) => item.genre === genre) : [];
  try {
    const rows = await queryContent({ genre });
    const result = rows.length ? rows : demoFallbackEnabled() ? genre === 'All' ? catalog : catalog.filter((item) => item.genre === genre) : [];
    fallbackByGenre.set(genre, result);
    return result;
  } catch {
    return demoFallbackEnabled() ? genre === 'All' ? catalog : catalog.filter((item) => item.genre === genre) : [];
  }
}
