import { getSupabaseClient } from './supabaseService.js';

async function client() {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export function isAdmin(user) {
  return user?.app_metadata?.role === 'admin';
}

export async function getAdminContent({ search = '', status = 'all' } = {}) {
  const supabase = await client();
  let query = supabase.from('content').select('*, content_genres(genre_id,genres(id,name,slug)), video_assets(id,provider,playback_id,playback_policy,duration,status)').order('updated_at', { ascending: false });
  if (status !== 'all') query = query.eq('status', status);
  if (search.trim()) {
    const safeSearch = search.trim().replace(/[(),.*]/g, ' ');
    query = query.or(`title.ilike.%${safeSearch}%,slug.ilike.%${safeSearch}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAdminContentById(id) {
  const supabase = await client();
  const { data, error } = await supabase.from('content').select('*, content_genres(genre_id,genres(id,name,slug)), video_assets(id,provider,playback_id,playback_policy,duration,status)').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getAdminGenres() {
  const supabase = await client();
  const { data, error } = await supabase.from('genres').select('id,name,slug').order('name');
  if (error) throw error;
  return data || [];
}

export async function createAdminContent(values) {
  const supabase = await client();
  const { data, error } = await supabase.from('content').insert(values).select().single();
  if (error) throw error;
  return data;
}

export async function updateAdminContent(id, values) {
  const supabase = await client();
  const { data, error } = await supabase.from('content').update(values).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAdminContent(id) {
  const supabase = await client();
  const { error } = await supabase.from('content').delete().eq('id', id);
  if (error) throw error;
}

export async function replaceContentGenres(contentId, genreIds) {
  const supabase = await client();
  const remove = await supabase.from('content_genres').delete().eq('content_id', contentId);
  if (remove.error) throw remove.error;
  if (!genreIds.length) return;
  const { error } = await supabase.from('content_genres').insert(genreIds.map((genreId) => ({ content_id: contentId, genre_id: genreId })));
  if (error) throw error;
}

export async function upsertVideoAsset(contentId, values) {
  const supabase = await client();
  const payload = { content_id: contentId, provider: values.provider, playback_id: values.playbackId, playback_policy: values.playbackPolicy, duration: values.duration ? Number(values.duration) : null, status: values.status };
  if (values.id) {
    const { data, error } = await supabase.from('video_assets').update(payload).eq('id', values.id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('video_assets').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deleteVideoAsset(id) {
  const supabase = await client();
  const { error } = await supabase.from('video_assets').delete().eq('id', id);
  if (error) throw error;
}
