-- ============================================
-- Add category and content_hash columns 
-- Using exact category names as specified
-- ============================================
-- Run this in Supabase SQL Editor

-- 1. Add category column (no CHECK constraint for flexibility)
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'evidence';

-- 2. Add content_hash column (for duplicate detection)
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_files_category ON user_files(category);
CREATE INDEX IF NOT EXISTS idx_user_files_content_hash ON user_files(content_hash);

-- 4. Create composite index for duplicate detection query
CREATE INDEX IF NOT EXISTS idx_user_files_duplicate_check 
ON user_files(user_id, application_id, category, content_hash);

-- 5. Add comments for documentation
COMMENT ON COLUMN user_files.category IS 'File category: evidence, resumeCV, graduationcertificates, employmentverification, futureplan, other_personalinfo, form';
COMMENT ON COLUMN user_files.content_hash IS 'SHA-256 hash of file content for duplicate detection within same category';

-- ============================================
-- If you already have a CHECK constraint, remove it:
-- ============================================
ALTER TABLE user_files DROP CONSTRAINT IF EXISTS user_files_category_check;

-- ============================================
-- Verify changes
-- ============================================
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_files' 
AND column_name IN ('category', 'content_hash')
ORDER BY column_name;

-- ============================================
-- Standard category values (for reference only)
-- ============================================
-- evidence                  - Criteria Mapping / NIW
-- resumeCV                  - Personal Info - Resume / CV (uploads.degrees)
-- graduationcertificates    - Personal Info - Graduation Certificates (uploads.certificates)
-- employmentverification    - Personal Info - Employment Verification (uploads.employment)
-- futureplan                - Personal Info - Future Work Plan (uploads.futurePlan)
-- other_personalinfo        - Personal Info - Other Documents (uploads.others)
-- form                      - Form page
