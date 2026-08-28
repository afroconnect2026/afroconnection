-- Add thumbnail/image support for opportunities
-- Run this in Supabase SQL Editor

-- Add image field to opportunities table
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create storage bucket for opportunity images
INSERT INTO storage.buckets (id, name, public)
VALUES ('opportunity-images', 'opportunity-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for opportunity-images bucket
CREATE POLICY "Opportunity images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'opportunity-images');

CREATE POLICY "Authenticated users can upload opportunity images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'opportunity-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own opportunity images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'opportunity-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own opportunity images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'opportunity-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
