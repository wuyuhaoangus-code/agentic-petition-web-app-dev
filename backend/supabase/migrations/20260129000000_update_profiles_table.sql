-- Update profiles table with more detailed information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS field TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT;

-- Update full_name to be a generated column if possible, 
-- or just keep it for backward compatibility and sync it.
-- For now, let's just add the columns.
