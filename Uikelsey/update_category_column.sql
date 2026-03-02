-- ============================================
-- Update user_files table: Use category column (not evidence)
-- ============================================
-- Run this in Supabase SQL Editor

-- NOTE: If you already have an 'evidence' column, rename it to 'category'
-- Otherwise, just add the category column

-- Option 1: If 'evidence' column exists, rename it
-- ALTER TABLE user_files RENAME COLUMN evidence TO category;

-- Option 2: If 'category' doesn't exist, add it
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'evidence' 
CHECK (category IN (
  'evidence',                    -- Criteria Mapping / NIW Requirements Mapping
  'resume',                      -- Personal Information: Resume
  'graduation_certificates',     -- Personal Information: Graduation Certificates
  'employment_verification',     -- Personal Information: Employment Verification
  'future_work_plan',           -- Personal Information: Future Work Plan
  'form'                         -- Form page
));

-- Add content_hash column (for duplicate detection)
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_files_category ON user_files(category);
CREATE INDEX IF NOT EXISTS idx_user_files_content_hash ON user_files(content_hash);

-- Create composite index for duplicate detection query
CREATE INDEX IF NOT EXISTS idx_user_files_duplicate_check 
ON user_files(user_id, application_id, category, content_hash);

-- Add comments for documentation
COMMENT ON COLUMN user_files.category IS 'File category: evidence (Criteria Mapping/NIW), resume/graduation_certificates/employment_verification/future_work_plan (Personal Info), or form (Form page)';
COMMENT ON COLUMN user_files.content_hash IS 'SHA-256 hash of file content for duplicate detection within same category';

-- ============================================
-- Verify changes
-- ============================================
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_files' 
AND column_name IN ('category', 'content_hash')
ORDER BY column_name;
