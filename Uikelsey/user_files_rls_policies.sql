-- ============================================
-- RLS Policies for user_files Table
-- ============================================
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on user_files table
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to view their own files
CREATE POLICY "Users can view own files"
ON user_files
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Allow users to insert their own files
CREATE POLICY "Users can insert own files"
ON user_files
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to update their own files
CREATE POLICY "Users can update own files"
ON user_files
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON user_files
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- Verify policies (optional - just for checking)
-- ============================================
-- SELECT * FROM pg_policies WHERE tablename = 'user_files';
