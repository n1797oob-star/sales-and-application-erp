import { createClient } from '@supabase/supabase-js';

// Vite exposes env variables with VITE_ prefix
const rawUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const rawKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  rawUrl.startsWith('http') &&
  !rawUrl.includes('placeholder')
);

// Fallback dummy client so createClient never throws on startup
const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://dummy-app-placeholder.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper: Sign up a new user in Supabase Auth + create profile row
export const signUp = async (email, password, name = '', avatar = '', role = 'MANAGER') => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, avatar_url: avatar, role } },
  });
  if (error) throw error;
  if (data?.user) {
    try {
      await supabase.from('profiles').upsert({ id: data.user.id, role, name, email, avatar });
    } catch (e) {
      console.warn('Profiles upsert skipped:', e);
    }
  }
  return data?.user;
};

// Helper: Sign in
export const signIn = async (email, password) => {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

// Helper: Sign out
export const signOut = async () => {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Supabase signOut error:', e);
  }
};
