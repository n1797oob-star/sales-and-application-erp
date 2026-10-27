-- ================================================================
-- TMI ERP - Supabase Setup SQL (SAFE TO RE-RUN)
-- Paste this in: Supabase Dashboard > SQL Editor > New Query > Run
-- ================================================================


-- ================================================================
-- 1. PROFILES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT,
  avatar TEXT,
  gender TEXT DEFAULT 'Male',
  department TEXT,
  territory TEXT DEFAULT 'Pan-India',
  status TEXT DEFAULT 'Active',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on profiles (safe to re-run)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
  END LOOP;
END $$;

-- Create fresh policies
CREATE POLICY "profiles_all_authenticated"
  ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "profiles_all_anon"
  ON profiles FOR ALL TO anon USING (true) WITH CHECK (true);


-- ================================================================
-- 2. ERP_SHARED_DATA TABLE
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

-- Create fresh policies (authenticated AND anon can read/write so all synced data works)
CREATE POLICY "erp_data_all_authenticated"
  ON erp_shared_data FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "erp_data_all_anon"
  ON erp_shared_data FOR ALL TO anon USING (true) WITH CHECK (true);


-- ================================================================
-- 3. REALTIME (enable live sync across all devices)
-- ================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_shared_data;
  EXCEPTION WHEN OTHERS THEN
    -- Already added, safe to ignore
    NULL;
  END;
END $$;


-- ================================================================
-- 4. AUTO-SYNC TRIGGER (new Auth users auto-added to profiles)
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
    name   = COALESCE(EXCLUDED.name, profiles.name),
    role   = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ================================================================
-- Done! Now go to:
-- Supabase > Authentication > Email > DISABLE "Confirm email"
-- ================================================================
