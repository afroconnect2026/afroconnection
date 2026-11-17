-- =====================================================
-- ADD MULTI-LANGUAGE SUPPORT
-- =====================================================
-- Adds language preference column to profiles table
-- Supports English (en) and French (fr)
-- =====================================================

-- Add language column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en' CHECK (language IN ('en', 'fr'));

-- Add index for faster language-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_language ON profiles(language);

-- Update existing users to have default language (English)
UPDATE profiles SET language = 'en' WHERE language IS NULL;

-- Add comment
COMMENT ON COLUMN profiles.language IS 'User preferred language: en (English) or fr (French)';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that column was added:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name = 'language';

-- Check language distribution:
-- SELECT language, COUNT(*) as user_count
-- FROM profiles
-- GROUP BY language
-- ORDER BY user_count DESC;
