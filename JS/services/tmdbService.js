import { getSupabaseClient, isConfigured as isSupabaseConfigured } from './supabaseService.js';

async function invoke(action, payload = {}) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke('tmdb-proxy', { body: { action, ...payload } });
  if (error) throw new Error(error.message || 'TMDB request failed.');
  return data;
}

export function isConfigured() {
  return isSupabaseConfigured();
}

export async function discoverMovies(options = {}) { return invoke('discover', options); }
export async function searchTitles(query, page = 1) { return invoke('search', { query: query.trim(), page }); }
export async function getMovieDetails(tmdbId) { return invoke('details', { tmdbId }); }
export async function getGenres() { return invoke('genres'); }
export async function getCredits(tmdbId) { return invoke('credits', { tmdbId }); }
export async function getSimilar(tmdbId, page = 1) { return invoke('similar', { tmdbId, page }); }
export async function getVideos(tmdbId) { return invoke('videos', { tmdbId }); }
