import { createClient } from '@supabase/supabase-js';

// Support Vite env variables or runtime localStorage settings
const getStoredConfig = () => {
  const envUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const envKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('tmi_supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('tmi_supabase_anon_key') || '' : '';

  const finalUrl = (envUrl || localUrl).trim();
  const finalKey = (envKey || localKey).trim();

  return {
    url: finalUrl,
    key: finalKey,
    isConfigured: Boolean(
      finalUrl &&
      finalKey &&
      finalUrl.startsWith('http') &&
      !finalUrl.includes('placeholder')
    ),
  };
};

const initialConfig = getStoredConfig();

export const isSupabaseConfigured = initialConfig.isConfigured;

const supabaseUrl = initialConfig.isConfigured
  ? initialConfig.url
  : 'https://dummy-app-placeholder.supabase.co';
const supabaseAnonKey = initialConfig.isConfigured
  ? initialConfig.key
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Allow user to set credentials in UI without rebuild
export const setSupabaseCredentials = (url, key) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tmi_supabase_url', url.trim());
    localStorage.setItem('tmi_supabase_anon_key', key.trim());
    window.location.reload();
  }
};

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tmi_supabase_url');
    localStorage.removeItem('tmi_supabase_anon_key');
    window.location.reload();
  }
};

// Create user from Admin Panel without logging out the currently active Admin
export const createAdminUser = async (email, password, name, role, extra = {}) => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    // Isolated client so Admin session is not replaced
    const isolatedClient = createClient(initialConfig.url, initialConfig.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const userDepartment =
      extra.department ||
      (role === 'Application Engineer'
        ? 'Application Engineering'
        : role === 'Sales Engineer'
        ? 'Sales & Marketing'
        : 'Executive Board');

    const { data, error } = await isolatedClient.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          full_name: name,
          role: role,
          avatar_url: extra.avatar || '',
          gender: extra.gender || 'Male',
          department: userDepartment,
          territory: extra.territory || 'Pan-India',
          phone: extra.phone || '',
          status: extra.status || 'Active',
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

    // Upsert into `profiles` table using client
    try {
      const profilePayload = {
        id: userId,
        role: role,
        name: name || '',
        email: email.trim(),
        avatar: extra.avatar || '',
        gender: extra.gender || 'Male',
        department: userDepartment,
        territory: extra.territory || 'Pan-India',
        status: extra.status || 'Active',
        phone: extra.phone || '',
      };

      // If isolatedClient has an active session for the new user, use it; otherwise use main client
      const clientToUse = data.session ? isolatedClient : supabase;
      const { error: profileErr } = await clientToUse.from('profiles').upsert(profilePayload);
      if (profileErr) {
        console.warn('Profile table upsert notice (safe if table trigger handled it):', profileErr.message);
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
