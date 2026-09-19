import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { importPKCS8, SignJWT } from 'https://esm.sh/jose@5.10.0';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } }); }

async function getUser(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Authentication required.');
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error('Authentication required.');
  return data.user;
}

async function signedMuxUrl(playbackId: string, expiresIn = 900) {
  const keyId = Deno.env.get('MUX_SIGNING_KEY_ID');
  const privateKey = Deno.env.get('MUX_SIGNING_KEY_SECRET');
  if (!keyId || !privateKey) throw new Error('Mux signing credentials are not configured.');
  const key = await importPKCS8(privateKey.replace(/\\n/g, '\n'), 'RS256');
  const token = await new SignJWT({ sub: playbackId, aud: 'v' }).setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: keyId }).setIssuedAt().setExpirationTime(`${expiresIn}s`).sign(key);
  return { url: `https://stream.mux.com/${encodeURIComponent(playbackId)}.m3u8?token=${token}`, expiresAt: Date.now() + expiresIn * 1000 };
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  try {
    await getUser(request);
    const { contentId } = await request.json();
    if (!contentId || typeof contentId !== 'string') return json({ error: 'A valid content ID is required.' }, 400);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: content, error } = await admin.from('content').select('id,status,video_assets(id,provider,playback_id,playback_policy,status,duration)').eq('id', contentId).eq('status', 'published').maybeSingle();
    if (error) throw error;
    const asset = content?.video_assets?.find((candidate: any) => candidate.provider === 'mux' && candidate.status === 'ready');
    if (!content || !asset) return json({ error: 'No authorized playback asset is available for this title.' }, 404);
    const playback = asset.playback_policy === 'signed' ? await signedMuxUrl(asset.playback_id) : { url: `https://stream.mux.com/${encodeURIComponent(asset.playback_id)}.m3u8`, expiresAt: null };
    return json({ contentId: content.id, assetId: asset.id, playbackUrl: playback.url, expiresAt: playback.expiresAt, duration: asset.duration });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Playback authorization failed.' }, 403);
  }
});
