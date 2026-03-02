-- Add file_size column to user_files table
ALTER TABLE public.user_files ADD COLUMN IF NOT EXISTS file_size bigint;

-- Update existing records to have a default size of 0 if needed (optional)
-- UPDATE public.user_files SET file_size = 0 WHERE file_size IS NULL;
