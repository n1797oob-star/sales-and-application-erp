-- ================================================================
-- TMI ERP - Supabase Setup SQL (SAFE TO RE-RUN AT ANY TIME)
-- Paste this in: Supabase Dashboard > SQL Editor > New Query > Run
-- ================================================================


-- ================================================================
-- 1. PROFILES TABLE (Ensures all columns exist)
-- ================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT,
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
-- CRITICAL ONE-TIME SETTING IN SUPABASE DASHBOARD:
-- Go to: Supabase Dashboard > Authentication > Providers > Email
-- Turn OFF / DISABLE: "Confirm email"
-- (This allows users to be created instantly and log in without verification emails)
-- ================================================================
