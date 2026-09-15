-- FINAL FIX: Completely reset and fix profiles RLS policies
-- This allows all authenticated users to read all profiles

-- First, drop ALL existing policies on profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive read policy
-- Allow ALL authenticated users to read ALL profiles
CREATE POLICY "authenticated_users_read_all_profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own profile only
CREATE POLICY "users_insert_own_profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile only
CREATE POLICY "users_update_own_profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile only
CREATE POLICY "users_delete_own_profile"
ON profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
