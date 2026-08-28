-- Create Storage Bucket for Event Images
-- Run this in Supabase SQL Editor

-- Create public-uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-uploads',
  'public-uploads',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for public-uploads bucket
-- Anyone can view files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-uploads');

-- Authenticated users can upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-uploads');

-- Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
