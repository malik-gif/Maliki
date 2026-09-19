const viteEnv = import.meta.env || {};
const runtimeConfig = globalThis.MALIKI_CONFIG || {};
const config = {
  url: runtimeConfig.supabaseUrl || viteEnv.VITE_SUPABASE_URL || '',
  anonKey: runtimeConfig.supabaseAnonKey || viteEnv.VITE_SUPABASE_ANON_KEY || ''
};

let clientPromise;

export function isConfigured() {
  return Boolean(config.url && config.anonKey);
}

export function getConfigStatus() {
  return { configured: isConfigured(), provider: 'supabase' };
}

export async function getSupabaseClient() {
  if (!isConfigured()) return null;
  if (!clientPromise) {
    clientPromise = import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) => createClient(config.url, config.anonKey));
  }
  return clientPromise;
}
