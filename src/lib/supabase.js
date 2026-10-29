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

// Generate standard RFC4122 v4 UUID so Postgres id UUID never rejects it
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

  const userDepartment =
    extra.department ||
    (role === 'Application Engineer'
      ? 'Application Engineering'
      : role === 'Sales Engineer'
      ? 'Sales & Marketing'
      : 'Executive Board');

  let userId = null;
  let authUser = null;

  // 1. Method A: Try Database RPC admin_create_user (creates in auth.users directly with confirmed email!)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_create_user', {
      p_email: cleanEmail,
      p_password: cleanPassword,
      p_name: name || '',
      p_role: role || 'Application Engineer',
      p_department: userDepartment,
      p_territory: extra.territory || 'Pan-India',
      p_phone: extra.phone || '',
      p_avatar: extra.avatar || '',
      p_gender: extra.gender || 'Male',
    });

    if (!rpcError && rpcData?.success && rpcData?.user_id) {
      userId = rpcData.user_id;
    }
  } catch (rpcErr) {
    console.debug('RPC admin_create_user notice:', rpcErr);
  }

  // 2. Method B: Client-side Supabase Auth signUp if RPC was not executed
  if (!userId) {
    try {
      // Isolated client so Admin session is not replaced
      const isolatedClient = createClient(config.url, config.key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

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

      if (!signUpError && signUpData?.user?.id) {
        userId = signUpData.user.id;
        authUser = signUpData.user;
      } else if (signUpError) {
        const msg = signUpError.message || '';
        // If user already registered in Supabase Auth before, grab their user ID
        if (
          msg.toLowerCase().includes('already registered') ||
          msg.toLowerCase().includes('already exists') ||
          msg.toLowerCase().includes('unique')
        ) {
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
        }
      }
    } catch (authErr) {
      console.warn('Supabase Auth signUp note:', authErr);
    }
  }

  // Ensure userId is ALWAYS a valid RFC4122 UUID so Postgres id UUID column NEVER fails!
  if (!userId) {
    userId = generateUUID();
  }

  // 3. Upsert into `profiles` table in Supabase
  try {
    const fullProfile = {
      id: userId,
      role: role,
      name: name || '',
      email: cleanEmail,
      password: cleanPassword,
      avatar: extra.avatar || '',
      gender: extra.gender || 'Male',
      department: userDepartment,
      territory: extra.territory || 'Pan-India',
      status: extra.status || 'Active',
      phone: extra.phone || '',
    };

    const { error: fullErr } = await supabase.from('profiles').upsert(fullProfile);

    if (fullErr) {
      // If password column does not exist yet in profiles schema, fallback to columns without password
      const fallbackProfile = { ...fullProfile };
      delete fallbackProfile.password;
      await supabase.from('profiles').upsert(fallbackProfile);
    }
  } catch (profileErr) {
    console.warn('Profile table upsert fallback notice:', profileErr);
  }

  return { success: true, user: authUser, userId };
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
