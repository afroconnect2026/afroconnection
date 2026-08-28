-- =====================================================
-- FIX PII LEAK (CORRECTED VERSION)
-- Uses column-level grants to hide email/phone
-- while keeping profiles browsable
-- =====================================================

-- Update the row-level policy to allow authenticated users to browse active profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable with PII restrictions" ON profiles;

CREATE POLICY "Active profiles viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Revoke all SELECT on profiles table
REVOKE SELECT ON profiles FROM anon, authenticated;

-- Grant SELECT only on non-PII columns to authenticated users
GRANT SELECT (
  id,
  created_at,
  updated_at,
  full_name,
  avatar_url,
  bio,
  user_type,
  country,
  city,
  website_url,
  linkedin_url,
  twitter_url,
  is_verified,
  is_active,
  onboarding_completed
) ON profiles TO authenticated;

-- Users can still access their own email via auth.user().email in client
-- No need to expose the email column from the profiles table

-- =====================================================
-- DONE: Email and phone columns are now unreadable
-- even with direct API queries using the anon key
-- Profiles remain fully browsable for non-PII fields
-- =====================================================
