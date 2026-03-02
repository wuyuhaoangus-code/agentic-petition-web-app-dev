-- =====================================================
-- DreamCardAI Profiles Table Setup
-- =====================================================
-- Run this in Supabase SQL Editor to create the profiles table
-- and configure Row Level Security (RLS) policies

-- 1. Create profiles table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  occupation TEXT,
  field TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
-- =====================================================
-- This ensures users can only access their own data
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (for clean setup)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- 4. Create RLS policies
-- =====================================================

-- Allow users to SELECT their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to INSERT their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to DELETE their own profile
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

-- 5. Create function to automatically update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for updated_at
-- =====================================================
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 8. Optional: Create a function to automatically create profile on user signup
-- =====================================================
-- This trigger will automatically create a profile record when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. Grant necessary permissions
-- =====================================================
-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 10. Verification queries
-- =====================================================
-- Run these to verify the setup:

-- Check if table exists
-- SELECT * FROM information_schema.tables WHERE table_name = 'profiles';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check triggers
-- SELECT * FROM information_schema.triggers WHERE trigger_name LIKE '%profile%';

-- Test with current user (run after logging in)
-- SELECT * FROM profiles WHERE id = auth.uid();

COMMENT ON TABLE public.profiles IS 'User profile information for DreamCardAI application';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users.id';
COMMENT ON COLUMN public.profiles.first_name IS 'User first name';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name';
COMMENT ON COLUMN public.profiles.full_name IS 'User full name (computed from first + last)';
COMMENT ON COLUMN public.profiles.occupation IS 'User current occupation';
COMMENT ON COLUMN public.profiles.field IS 'User field of expertise';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar/profile picture';

-- =====================================================
-- Setup Complete!
-- =====================================================
-- Next steps:
-- 1. Refresh your application
-- 2. Login with your user account
-- 3. Navigate to Personal Information page
-- 4. Your profile should now work correctly!
-- =====================================================
