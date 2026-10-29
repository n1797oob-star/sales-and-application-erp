-- ================================================================
-- TMI ERP - Supabase Setup SQL (SAFE TO RE-RUN AT ANY TIME)
-- Paste this in: Supabase Dashboard > SQL Editor > New Query > Run
-- ================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================================================================
-- 1. PROFILES TABLE (Ensures all columns exist)
-- ================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT,
  password TEXT,
  avatar TEXT,
  gender TEXT DEFAULT 'Male',
  department TEXT DEFAULT 'Sales & App Engineering',
  territory TEXT DEFAULT 'Pan-India',
  status TEXT DEFAULT 'Active',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist even if profiles table was created earlier with fewer columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Sales & App Engineering';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS territory TEXT DEFAULT 'Pan-India';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on profiles (safe to re-run)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
  END LOOP;
END $$;

-- Create fresh universal policies (authenticated & anon clients can read/write profiles)
CREATE POLICY "profiles_all_authenticated"
  ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "profiles_all_anon"
  ON profiles FOR ALL TO anon USING (true) WITH CHECK (true);


-- ================================================================
-- 2. ERP_SHARED_DATA TABLE (Stores all shared ERP state)
-- ================================================================
CREATE TABLE IF NOT EXISTS erp_shared_data (
  id TEXT PRIMARY KEY,
  data JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE erp_shared_data ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on erp_shared_data
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'erp_shared_data' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON erp_shared_data';
  END LOOP;
END $$;

-- Create fresh policies
CREATE POLICY "erp_data_all_authenticated"
  ON erp_shared_data FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "erp_data_all_anon"
  ON erp_shared_data FOR ALL TO anon USING (true) WITH CHECK (true);


-- ================================================================
-- 3. REALTIME (enable live sync across all laptops)
-- ================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_shared_data;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;


-- ================================================================
-- 4. AUTO-SYNC TRIGGER (Fail-safe: will NEVER block user creation in Auth)
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, name, role, gender, department, territory, status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'Application Engineer'),
      COALESCE(NEW.raw_user_meta_data->>'gender', 'Male'),
      COALESCE(NEW.raw_user_meta_data->>'department', 'Application Engineering'),
      COALESCE(NEW.raw_user_meta_data->>'territory', 'Pan-India'),
      COALESCE(NEW.raw_user_meta_data->>'status', 'Active')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name  = COALESCE(EXCLUDED.name, profiles.name),
      role  = COALESCE(EXCLUDED.role, profiles.role);
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: try basic columns so trigger never blocks Auth user creation
    BEGIN
      INSERT INTO public.profiles (id, email, name, role)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'Application Engineer')
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Absolute safeguard: never abort the Auth transaction
      NULL;
    END;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ================================================================
-- 5. ADMIN DIRECT USER CREATION (Bypasses email limits & auto-confirms!)
-- ================================================================
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'Application Engineer',
  p_department TEXT DEFAULT 'Application Engineering',
  p_territory TEXT DEFAULT 'Pan-India',
  p_phone TEXT DEFAULT '',
  p_avatar TEXT DEFAULT '',
  p_gender TEXT DEFAULT 'Male'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
  v_existing_id UUID;
BEGIN
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email is required');
  END IF;

  p_email := lower(trim(p_email));

  -- Check if user already exists in auth.users
  SELECT id INTO v_existing_id FROM auth.users WHERE lower(email) = p_email LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    v_user_id := v_existing_id;
    -- Update existing user password and auto-confirm email
    IF p_password IS NOT NULL AND length(trim(p_password)) >= 6 THEN
      v_encrypted_pw := crypt(trim(p_password), gen_salt('bf'));
      UPDATE auth.users
      SET
        encrypted_password = v_encrypted_pw,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now(),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
          'full_name', p_name,
          'role', p_role,
          'department', p_department,
          'territory', p_territory,
          'phone', p_phone,
          'avatar_url', p_avatar,
          'gender', p_gender
        )
      WHERE id = v_user_id;
    END IF;
  ELSE
    -- Generate new user id and insert into auth.users directly
    -- Reuse existing profile id (keeps KRA/visit links intact), else generate a new one
    SELECT id INTO v_user_id FROM public.profiles WHERE lower(email) = p_email LIMIT 1;
    IF v_user_id IS NULL OR EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
      v_user_id := gen_random_uuid();
    END IF;
    v_encrypted_pw := crypt(trim(p_password), gen_salt('bf'));

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      v_user_id,
      'authenticated',
      'authenticated',
      p_email,
      v_encrypted_pw,
      now(), -- Auto-confirmed! Instant login on all devices
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'full_name', p_name,
        'role', p_role,
        'department', p_department,
        'territory', p_territory,
        'phone', p_phone,
        'avatar_url', p_avatar,
        'gender', p_gender
      ),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- GoTrue login breaks if these token columns are NULL - normalise them
  UPDATE auth.users SET
    confirmation_token     = COALESCE(confirmation_token, ''),
    recovery_token         = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change           = COALESCE(email_change, '')
  WHERE id = v_user_id;

  -- Email/password login requires an identity row
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', true),
      'email',
      now(), now(), now()
    );
  END IF;

  -- Remove duplicate profile rows for same email with a different id
  DELETE FROM public.profiles WHERE lower(email) = p_email AND id <> v_user_id;

  -- Upsert in public.profiles table
  INSERT INTO public.profiles (
    id, email, name, role, department, territory, phone, avatar, gender, password, status
  ) VALUES (
    v_user_id,
    p_email,
    COALESCE(NULLIF(p_name, ''), split_part(p_email, '@', 1)),
    p_role,
    p_department,
    p_territory,
    p_phone,
    p_avatar,
    p_gender,
    p_password,
    'Active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), profiles.name),
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    territory = EXCLUDED.territory,
    phone = EXCLUDED.phone,
    avatar = EXCLUDED.avatar,
    gender = EXCLUDED.gender,
    password = EXCLUDED.password,
    status = EXCLUDED.status;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_user TO authenticated, anon;


-- ================================================================
-- 6. ADMIN DIRECT USER DELETION (Removes from auth & profiles)
-- ================================================================
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = p_user_id;
  DELETE FROM public.profiles WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated, anon;


-- ================================================================
-- 7. ONE-TIME REPAIR OF EXISTING USERS (safe to re-run)
--    Confirms all existing users, fixes NULL tokens, adds missing identities,
--    and syncs passwords saved in profiles into Supabase Auth.
-- ================================================================
UPDATE auth.users SET
  email_confirmed_at     = COALESCE(email_confirmed_at, now()),
  confirmation_token     = COALESCE(confirmation_token, ''),
  recovery_token         = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change           = COALESCE(email_change, '');

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email');

-- Re-create Auth accounts for any profile that has a saved password (fixes users added before this fix)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT * FROM public.profiles WHERE password IS NOT NULL AND length(password) >= 6 LOOP
    PERFORM public.admin_create_user(r.email, r.password, r.name, r.role, r.department, r.territory, r.phone, r.avatar, r.gender);
  END LOOP;
END $$;


-- ================================================================
-- CRITICAL ONE-TIME SETTING IN SUPABASE DASHBOARD:
-- Go to: Supabase Dashboard > Authentication > Providers > Email
-- Turn OFF / DISABLE: "Confirm email"
-- ================================================================
