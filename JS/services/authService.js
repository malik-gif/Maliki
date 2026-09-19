import { getSupabaseClient, isConfigured } from './supabaseService.js';

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function requireConfiguration() {
  if (!isConfigured()) throw new Error('Supabase is not configured. Add the public project URL and anon key to continue.');
}

function authError(error) {
  const message = String(error?.message || 'Authentication failed.');
  if (message.toLowerCase().includes('invalid login credentials')) return new Error('Email or password is incorrect.');
  if (message.toLowerCase().includes('already registered')) return new Error('An account with this email already exists.');
  return new Error(message);
}

async function client() {
  requireConfiguration();
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function getCurrentSession() {
  if (!isConfigured()) return { session: null, user: null };
  const supabase = await client();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw authError(error);
  return { session: data.session, user: data.session?.user || null };
}

export async function listenForAuthChanges(callback) {
  if (!isConfigured()) return () => {};
  const supabase = await client();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback({ session, user: session?.user || null }));
  return () => data.subscription.unsubscribe();
}

export async function signIn({ email, password }) {
  if (!validateEmail(email)) throw new Error('Enter a valid email address.');
  if (!validatePassword(password)) throw new Error('Password must be at least 8 characters.');
  try {
    const supabase = await client();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    return data;
  } catch (error) { throw authError(error); }
}

export async function signUp({ email, password, passwordConfirmation, displayName }) {
  if (!validateEmail(email)) throw new Error('Enter a valid email address.');
  if (!validatePassword(password)) throw new Error('Password must be at least 8 characters.');
  if (password !== passwordConfirmation) throw new Error('Passwords do not match.');
  try {
    const supabase = await client();
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: (displayName || '').trim() } } });
    if (error) throw error;
    if (data.user && data.session) await ensureProfile(data.user, displayName);
    return data;
  } catch (error) { throw authError(error); }
}

export async function ensureProfile(user, displayName = '') {
  const supabase = await client();
  const { error } = await supabase.from('profiles').upsert({ id: user.id, display_name: (displayName || '').trim() || user.user_metadata?.display_name || null }, { onConflict: 'id' });
  if (error) throw authError(error);
}

export async function signOut() {
  const supabase = await client();
  const { error } = await supabase.auth.signOut();
  if (error) throw authError(error);
}

export async function requestPasswordReset(email) {
  if (!validateEmail(email)) throw new Error('Enter a valid email address.');
  try {
    const supabase = await client();
    const redirectTo = `${window.location.origin}${window.location.pathname}?auth=reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) throw error;
  } catch (error) { throw authError(error); }
}

export async function updatePassword(password, confirmation) {
  if (!validatePassword(password)) throw new Error('Password must be at least 8 characters.');
  if (password !== confirmation) throw new Error('Passwords do not match.');
  try {
    const supabase = await client();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  } catch (error) { throw authError(error); }
}
