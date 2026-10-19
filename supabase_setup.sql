-- ============================================================================
-- TMI Management ERP - Supabase Cloud Database Setup Script
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ============================================================================

-- 1. Create erp_shared_data table for multi-device real-time sync
CREATE TABLE IF NOT EXISTS public.erp_shared_data (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on erp_shared_data
ALTER TABLE public.erp_shared_data ENABLE ROW LEVEL SECURITY;

-- Allow read/write access to erp_shared_data for authenticated and anon users
DROP POLICY IF EXISTS "Allow all read erp_shared_data" ON public.erp_shared_data;
CREATE POLICY "Allow all read erp_shared_data"
ON public.erp_shared_data
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow all write erp_shared_data" ON public.erp_shared_data;
CREATE POLICY "Allow all write erp_shared_data"
ON public.erp_shared_data
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Enable real-time broadcasting for erp_shared_data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'erp_shared_data'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_shared_data;
  END IF;
END $$;

-- 2. Create profiles table if not already present
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'Application Engineer',
  name TEXT,
  email TEXT,
  avatar TEXT,
  gender TEXT DEFAULT 'Male',
  department TEXT,
  territory TEXT,
  status TEXT DEFAULT 'Active',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all read profiles" ON public.profiles;
CREATE POLICY "Allow all read profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow all insert update profiles" ON public.profiles;
CREATE POLICY "Allow all insert update profiles"
ON public.profiles
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. Automatic Trigger: When a new user is created in auth.users, create their profile row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    avatar,
    gender,
    department,
    territory,
    phone,
    status
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'Application Engineer'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'gender', 'Male'),
    COALESCE(new.raw_user_meta_data->>'department', 'Application Engineering'),
    COALESCE(new.raw_user_meta_data->>'territory', 'Pan-India'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'status', 'Active')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    territory = EXCLUDED.territory;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Done!
