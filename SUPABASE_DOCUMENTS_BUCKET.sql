-- ============================================================
-- WREN HEALTH — Documents Storage Bucket + RLS
-- Run this in Supabase SQL Editor if uploads are failing
-- ============================================================

-- Create the documents storage bucket (public so uploaded URLs are accessible)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone authenticated can read (public bucket)
DROP POLICY IF EXISTS "documents_public_read" ON storage.objects;
CREATE POLICY "documents_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- RLS: only upload to your own folder (path: user_id/member_id/filename)
DROP POLICY IF EXISTS "documents_owner_upload" ON storage.objects;
CREATE POLICY "documents_owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "documents_owner_update" ON storage.objects;
CREATE POLICY "documents_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "documents_owner_delete" ON storage.objects;
CREATE POLICY "documents_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
