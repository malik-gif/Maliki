import { getSupabaseClient, isConfigured as isSupabaseConfigured } from './supabaseService.js';

export async function syncContentFromTmdb(options = {}) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.');
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('content-sync', { body: options });
  if (error) throw new Error(error.message || 'Content sync failed.');
  return data;
}
