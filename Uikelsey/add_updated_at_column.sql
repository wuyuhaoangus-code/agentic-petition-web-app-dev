-- ============================================
-- Add updated_at column to user_files table
-- ============================================
-- Run this in Supabase SQL Editor

-- 1. Add updated_at column with default value
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create a trigger to automatically update updated_at on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Drop trigger if exists (to avoid conflicts)
DROP TRIGGER IF EXISTS update_user_files_updated_at ON user_files;

-- 4. Create trigger on user_files table
CREATE TRIGGER update_user_files_updated_at
    BEFORE UPDATE ON user_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Add comment for documentation
COMMENT ON COLUMN user_files.updated_at IS 'Timestamp of last update, automatically maintained by trigger';

-- ============================================
-- Verify changes
-- ============================================
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_files' 
AND column_name = 'updated_at';
