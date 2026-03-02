-- ============================================
-- Setup RLS (Row Level Security) Policies for user_files table
-- ============================================
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on user_files table
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own files" ON user_files;
DROP POLICY IF EXISTS "Users can insert their own files" ON user_files;
DROP POLICY IF EXISTS "Users can update their own files" ON user_files;
DROP POLICY IF EXISTS "Users can delete their own files" ON user_files;

-- 3. Create SELECT policy (read access)
CREATE POLICY "Users can view their own files"
ON user_files
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Create INSERT policy (create access)
CREATE POLICY "Users can insert their own files"
ON user_files
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Create UPDATE policy (edit access)
-- ✅ This is the critical one for editing file criteria!
CREATE POLICY "Users can update their own files"
ON user_files
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Create DELETE policy (delete access)
CREATE POLICY "Users can delete their own files"
ON user_files
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- Verify policies are created
-- ============================================
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_files'
ORDER BY policyname;

-- ============================================
-- Test RLS is working (optional)
-- ============================================
-- SELECT 
--   id, 
--   file_name, 
--   user_id,
--   application_id,
--   criteria,
--   category
-- FROM user_files
-- LIMIT 5;
