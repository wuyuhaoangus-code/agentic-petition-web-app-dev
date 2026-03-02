-- Storage Policies for user-files bucket
-- Run these in Supabase SQL Editor to allow authenticated users to upload files

-- 1. Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow authenticated users to read files from their own folder
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow authenticated users to update files in their own folder
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow authenticated users to delete files from their own folder
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify the policies are created
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
