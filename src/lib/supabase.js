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

// Create user from Admin Panel without logging out the currently active Admin
export const createAdminUser = async (email, password, name, role, extra = {}) => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    // Isolated client so Admin session is not replaced
    const isolatedClient = createClient(rawUrl, rawKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await isolatedClient.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          full_name: name,
          role: role,
          avatar_url: extra.avatar || '',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const userId = data?.user?.id;
    if (!userId) {
      return { success: false, error: 'No user ID returned from Supabase Auth' };
    }

    // Upsert into `profiles` table using main client
    try {
      const profilePayload = {
        id: userId,
        role: role || 'SALES_ENGINEER',
        name: name || '',
      };
      await supabase.from('profiles').upsert(profilePayload);

      // Attempt to save extended fields if columns exist in profiles
      try {
        await supabase
          .from('profiles')
          .update({
            email: email.trim(),
            avatar: extra.avatar || '',
            department: extra.department || '',
            territory: extra.territory || '',
            status: extra.status || 'Active',
            phone: extra.phone || '',
          })
          .eq('id', userId);
      } catch (e) {
        // Column might not exist in profiles table; safe to ignore
      }
    } catch (profileErr) {
      console.warn('Profile upsert warning:', profileErr);
    }

    return { success: true, user: data.user, userId };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to create user in Supabase' };
  }
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
