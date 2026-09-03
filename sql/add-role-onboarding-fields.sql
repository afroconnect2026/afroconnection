-- =====================================================
-- Role specific onboarding fields (customer feedback #7)
-- =====================================================
-- Adds the fields captured by the role specific sign-up flow:
--   /auth/register?role=investor | founder | opportunities | funding
--
-- Safe to run more than once. Existing rows are unaffected and the
-- application keeps working if this migration has not been applied yet
-- (the values simply stay in auth.users.raw_user_meta_data).
-- =====================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_role text,
  ADD COLUMN IF NOT EXISTS primary_goal text,
  ADD COLUMN IF NOT EXISTS onboarding_answer text;

COMMENT ON COLUMN public.profiles.signup_role IS
  'Role specific CTA the member signed up through: investor | founder | opportunities | funding (falls back to user_type).';
COMMENT ON COLUMN public.profiles.primary_goal IS
  'What the member came to AfroConnect to do, derived from their sign-up path.';
COMMENT ON COLUMN public.profiles.onboarding_answer IS
  'Answer to the role specific onboarding question (funding stage, investment stage, opportunity type, ...).';

-- Index the role so the matching engine and admin reporting can filter on it.
CREATE INDEX IF NOT EXISTS idx_profiles_signup_role ON public.profiles(signup_role);

-- =====================================================
-- Extend the signup trigger to persist the new fields
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    user_type,
    signup_role,
    primary_goal,
    onboarding_answer,
    is_active,
    is_verified,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'entrepreneur'),
    NEW.raw_user_meta_data->>'signup_role',
    NEW.raw_user_meta_data->>'primary_goal',
    NEW.raw_user_meta_data->>'onboarding_answer',
    true,
    false,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Backfill existing members from their auth metadata
-- =====================================================
UPDATE public.profiles p
SET
  signup_role = COALESCE(p.signup_role, u.raw_user_meta_data->>'signup_role', p.user_type::text),
  primary_goal = COALESCE(p.primary_goal, u.raw_user_meta_data->>'primary_goal'),
  onboarding_answer = COALESCE(p.onboarding_answer, u.raw_user_meta_data->>'onboarding_answer')
FROM auth.users u
WHERE u.id = p.id
  AND p.signup_role IS NULL;
