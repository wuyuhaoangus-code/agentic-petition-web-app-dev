-- ============================================
-- Add category and content_hash columns to user_files table
-- ============================================
-- Run this in Supabase SQL Editor

-- 1. Add category column (for categorizing files)
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'evidence' 
CHECK (category IN ('evidence', 'resume', 'graduation_certificates', 'employment_verification', 'future_work_plan', 'form'));

-- 2. Add content_hash column (for duplicate detection)
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- 3. Create index on content_hash for faster duplicate checks
CREATE INDEX IF NOT EXISTS idx_user_files_content_hash ON user_files(content_hash);

-- 4. Create composite index for duplicate detection query
CREATE INDEX IF NOT EXISTS idx_user_files_duplicate_check 
ON user_files(user_id, application_id, category, content_hash);

-- 5. Add comments for documentation
COMMENT ON COLUMN user_files.category IS 'File category: evidence (Criteria Mapping/NIW), resume/graduation_certificates/employment_verification/future_work_plan (Personal Info), or form (Form page)';
COMMENT ON COLUMN user_files.content_hash IS 'SHA-256 hash of file content for duplicate detection within same category';

-- ============================================
-- Verify changes (optional - just for checking)
-- ============================================
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_files' 
-- AND column_name IN ('category', 'content_hash');
