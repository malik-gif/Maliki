import { getSupabaseClient } from './supabaseService.js';

async function client() {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

async function watchlistId(userId) {
  const supabase = await client();
  const existing = await supabase.from('watchlists').select('id').eq('user_id', userId).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id;
  const created = await supabase.from('watchlists').insert({ user_id: userId }).select('id').single();
  if (created.error) throw created.error;
  return created.data.id;
}

export async function getProfile(userId) {
  const supabase = await client();
  const { data, error } = await supabase.from('profiles').select('id,display_name,avatar_url,created_at,updated_at').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, values) {
  const supabase = await client();
  const { data, error } = await supabase.from('profiles').update({ display_name: values.displayName.trim(), avatar_url: values.avatarUrl?.trim() || null }).eq('id', userId).select().single();
  if (error) throw error;
  return data;
}

export async function getUserData(userId) {
  const supabase = await client();
  const listId = await watchlistId(userId);
  const [list, progress, history, profile] = await Promise.all([
    supabase.from('watchlist_items').select('content_id,content:content(*,content_genres(genres(name,slug)),video_assets(status))').eq('watchlist_id', listId).order('created_at', { ascending: false }),
    supabase.from('watch_progress').select('content_id,position_seconds,duration_seconds,updated_at').eq('user_id', userId).order('updated_at', { ascending: false }),
    supabase.from('watch_history').select('content_id,watched_at').eq('user_id', userId).order('watched_at', { ascending: false }).limit(50),
    getProfile(userId)
  ]);
  for (const result of [list, progress, history]) if (result.error) throw result.error;
  return { list: list.data || [], progress: progress.data || [], history: history.data || [], profile };
}

export async function addToList(userId, contentId) {
  const supabase = await client();
  const id = await watchlistId(userId);
  const { error } = await supabase.from('watchlist_items').upsert({ watchlist_id: id, content_id: contentId }, { onConflict: 'watchlist_id,content_id', ignoreDuplicates: true });
  if (error) throw error;
}

export async function removeFromList(userId, contentId) {
  const supabase = await client();
  const id = await watchlistId(userId);
  const { error } = await supabase.from('watchlist_items').delete().eq('watchlist_id', id).eq('content_id', contentId);
  if (error) throw error;
}

export async function saveProgress(userId, contentId, positionSeconds, durationSeconds) {
  const supabase = await client();
  const { error } = await supabase.from('watch_progress').upsert({ user_id: userId, content_id: contentId, position_seconds: Math.max(0, Math.floor(positionSeconds)), duration_seconds: durationSeconds ? Math.floor(durationSeconds) : null, updated_at: new Date().toISOString() }, { onConflict: 'user_id,content_id' });
  if (error) throw error;
}

export async function removeProgress(userId, contentId) {
  const supabase = await client();
  const { error } = await supabase.from('watch_progress').delete().eq('user_id', userId).eq('content_id', contentId);
  if (error) throw error;
}

export async function recordHistory(userId, contentId) {
  const supabase = await client();
  const recent = await supabase.from('watch_history').select('id').eq('user_id', userId).eq('content_id', contentId).gte('watched_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()).limit(1);
  if (recent.error) throw recent.error;
  if (!recent.data?.length) {
    const { error } = await supabase.from('watch_history').insert({ user_id: userId, content_id: contentId });
    if (error) throw error;
  }
}

export async function clearHistory(userId) {
  const supabase = await client();
  const { error } = await supabase.from('watch_history').delete().eq('user_id', userId);
  if (error) throw error;
}
