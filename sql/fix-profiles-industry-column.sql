-- Add industry column to profiles table if it doesn't exist
-- This fixes the 400 error when querying profiles

-- Add industry column (TEXT for simplicity, can be upgraded to array later)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'industry'
    ) THEN
        ALTER TABLE profiles ADD COLUMN industry TEXT;
    END IF;
END $$;

-- Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';
