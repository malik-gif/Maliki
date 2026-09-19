import { getSupabaseClient } from './supabaseService.js';

export async function authorizePlayback(contentId) {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Playback is unavailable until Supabase is configured.');
  const { data, error } = await supabase.functions.invoke('authorize-playback', { body: { contentId } });
  if (error || data?.error) throw new Error(data?.error || error?.message || 'Playback authorization failed.');
  return data;
}

export async function attachHls(video, playbackUrl) {
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = playbackUrl;
    return null;
  }
  const { default: Hls } = await import('https://esm.sh/hls.js@1.5.17');
  if (!Hls.isSupported()) throw new Error('This browser does not support HLS playback.');
  const hls = new Hls({ enableWorker: true });
  hls.loadSource(playbackUrl);
  hls.attachMedia(video);
  return hls;
}

export function createPlaybackSession(item, position = 0) {
  return { contentId: item.id, state: 'idle', position, duration: item.durationSeconds || 0, source: null };
}
