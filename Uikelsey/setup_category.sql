-- ============================================
-- Simplified: Add category and content_hash columns
-- NO CHECK constraint - accepts any string value
-- ============================================
-- Run this in Supabase SQL Editor

-- 1. Add category column (any string value allowed)
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'evidence';

-- 2. Add content_hash column (for duplicate detection)
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- 3. Remove CHECK constraint if it exists
ALTER TABLE user_files DROP CONSTRAINT IF EXISTS user_files_category_check;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_files_category ON user_files(category);
CREATE INDEX IF NOT EXISTS idx_user_files_content_hash ON user_files(content_hash);
CREATE INDEX IF NOT EXISTS idx_user_files_duplicate_check 
ON user_files(user_id, application_id, category, content_hash);

-- Done! ✅
