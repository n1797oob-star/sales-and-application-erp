import { createClient } from '@supabase/supabase-js';

// Support Vite env variables or runtime localStorage settings
export const getStoredConfig = () => {
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
  const config = getStoredConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      error: 'Supabase is not configured. Please check your Supabase URL & Anon Key in Cloud Settings.',
    };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail) {
    return { success: false, error: 'Email address is required.' };
  }

  if (cleanPassword.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters long for Supabase authentication.',
    };
  }

  try {
    // Isolated client so Admin session is not replaced
    const isolatedClient = createClient(config.url, config.key, {
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

    let userId = null;
    let authUser = null;

    // 1. Attempt to sign up the new user in Supabase Auth
    const { data: signUpData, error: signUpError } = await isolatedClient.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
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

    if (signUpError) {
      const msg = signUpError.message || '';

      // If user was already registered in Supabase Auth before
      if (
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('unique')
      ) {
        // Try signing in to verify password and get user ID
        try {
          const { data: signInData } = await isolatedClient.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          });
          if (signInData?.user?.id) {
            userId = signInData.user.id;
            authUser = signInData.user;
          }
        } catch (e) {}

        if (!userId) {
          // Query profiles table for existing user ID
          try {
            const { data: pData } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', cleanEmail)
              .single();
            if (pData?.id) {
              userId = pData.id;
            }
          } catch (e) {}
        }

        userId = userId || `u-${Date.now()}`;
      } else {
        // For rate limit or any other auth error: fallback to database profile creation so admin can add unlimited users without interruption!
        console.warn('Supabase Auth note (creating profile in database):', msg);
        userId = userId || `u-${Date.now()}`;
      }
    } else {
      userId = signUpData?.user?.id;
      authUser = signUpData?.user;
    }

    if (!userId) {
      userId = `u-${Date.now()}`;
    }

    // 2. Upsert into `profiles` table
    try {
      const fullProfile = {
        id: userId,
        role: role,
        name: name || '',
        email: cleanEmail,
        avatar: extra.avatar || '',
        gender: extra.gender || 'Male',
        department: userDepartment,
        territory: extra.territory || 'Pan-India',
        status: extra.status || 'Active',
        phone: extra.phone || '',
      };

      const clientToUse = signUpData?.session ? isolatedClient : supabase;
      const { error: fullErr } = await clientToUse.from('profiles').upsert(fullProfile);

      if (fullErr) {
        // Fallback: upsert basic profile if some columns do not exist in the database schema
        console.warn('Full profile upsert notice, falling back to basic columns:', fullErr.message);
        const basicProfile = {
          id: userId,
          email: cleanEmail,
          name: name || '',
          role: role,
        };
        await clientToUse.from('profiles').upsert(basicProfile);
      }
    } catch (profileErr) {
      console.warn('Profile table upsert fallback notice:', profileErr);
    }

    return { success: true, user: authUser, userId };
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
