-- ================================================================
-- TMI ERP - Supabase Setup SQL
-- Run this ONCE in: Supabase Dashboard > SQL Editor > New Query
-- ================================================================

-- 1. profiles table (stores user info accessible from all devices)
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

-- Drop old policies if they exist (safe to re-run)
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_service_all" ON profiles;

CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated USING (true);

CREATE POLICY "profiles_service_all"
  ON profiles FOR ALL TO service_role USING (true);


-- 2. erp_shared_data table (stores ALL ERP data: visits, KRAs, orders, etc.)
CREATE TABLE IF NOT EXISTS erp_shared_data (
  id TEXT PRIMARY KEY,
  data JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE erp_shared_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_data_all_authenticated" ON erp_shared_data;
DROP POLICY IF EXISTS "erp_data_select_anon" ON erp_shared_data;

CREATE POLICY "erp_data_all_authenticated"
  ON erp_shared_data FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "erp_data_select_anon"
  ON erp_shared_data FOR SELECT TO anon USING (true);


-- 3. Enable realtime on erp_shared_data (live sync across all devices)
ALTER PUBLICATION supabase_realtime ADD TABLE erp_shared_data;


-- 4. Auto-sync new Auth users to profiles table (trigger)
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
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ================================================================
-- IMPORTANT: After running this, go to:
-- Supabase > Authentication > Email > DISABLE "Confirm email"
-- (So admin-created users can log in immediately without email verification)
-- ================================================================
