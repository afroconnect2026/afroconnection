-- Add cover_url column to profiles table
-- Run this in Supabase SQL Editor

-- Add cover_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cover_url TEXT;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN profiles.cover_url IS 'URL to user cover/banner image stored in covers bucket';
