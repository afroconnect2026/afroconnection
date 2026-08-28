-- =====================================================
-- FIX PII LEAK - Restrict Email/Phone Visibility
-- CRITICAL SECURITY FIX
-- =====================================================

-- Drop the existing overly-permissive SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create new restricted SELECT policy
-- Email and phone are PII and should NOT be publicly visible
-- Users can only see their own email/phone OR those they're connected with
CREATE POLICY "Profiles are viewable with PII restrictions"
  ON profiles FOR SELECT
  USING (
    is_active = true AND (
      -- Allow reading own profile (all fields including email/phone)
      auth.uid() = id
      -- Other users can see profile BUT email/phone will be filtered at app level
      -- OR we can do it here but that requires a connections table check
    )
  );

-- Alternative: Create a public view without PII for general browsing
CREATE OR REPLACE VIEW profiles_public AS
SELECT
  id,
  created_at,
  updated_at,
  full_name,
  avatar_url,
  bio,
  user_type,
  country,
  city,
  -- Deliberately EXCLUDE email and phone
  website_url,
  linkedin_url,
  twitter_url,
  is_verified,
  onboarding_completed
FROM profiles
WHERE is_active = true;

-- Grant SELECT on the public view to authenticated users
GRANT SELECT ON profiles_public TO authenticated;

-- =====================================================
-- IMPORTANT: Update your app code to use profiles_public
-- for browsing/explore pages, and only query profiles
-- table when viewing own profile
-- =====================================================
