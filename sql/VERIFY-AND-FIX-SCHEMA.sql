-- ============================================
-- COMPREHENSIVE SCHEMA VERIFICATION & FIXES
-- Run this in Supabase SQL Editor to ensure all fixes are applied
-- ============================================

-- 1. VERIFY OPPORTUNITIES TABLE
-- Check if column is named 'type' (correct) or 'opportunity_type' (old)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opportunities' AND column_name = 'opportunity_type'
    ) THEN
        -- Rename to 'type'
        ALTER TABLE opportunities RENAME COLUMN opportunity_type TO type;
        RAISE NOTICE 'Fixed: Renamed opportunity_type to type';
    ELSE
        RAISE NOTICE 'OK: opportunities.type column exists';
    END IF;
END $$;

-- Check if column is named 'creator_id' (correct) or 'posted_by' (old)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opportunities' AND column_name = 'posted_by'
    ) THEN
        -- Rename to 'creator_id'
        ALTER TABLE opportunities RENAME COLUMN posted_by TO creator_id;
        RAISE NOTICE 'Fixed: Renamed posted_by to creator_id';
    ELSE
        RAISE NOTICE 'OK: opportunities.creator_id column exists';
    END IF;
END $$;

-- Ensure correct foreign key exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'opportunities_creator_id_fkey'
    ) THEN
        -- Drop old FK if exists
        ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_posted_by_fkey;

        -- Add correct FK
        ALTER TABLE opportunities
        ADD CONSTRAINT opportunities_creator_id_fkey
        FOREIGN KEY (creator_id) REFERENCES profiles(id) ON DELETE CASCADE;

        RAISE NOTICE 'Fixed: Added opportunities_creator_id_fkey';
    ELSE
        RAISE NOTICE 'OK: opportunities_creator_id_fkey exists';
    END IF;
END $$;

-- 2. VERIFY PROFILES TABLE
-- Check if industry column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'industry'
    ) THEN
        ALTER TABLE profiles ADD COLUMN industry TEXT;
        RAISE NOTICE 'Fixed: Added industry column to profiles';
    ELSE
        RAISE NOTICE 'OK: profiles.industry column exists';
    END IF;
END $$;

-- 3. VERIFY CONNECTIONS TABLE
-- Check if foreign keys point to profiles (correct) not auth.users (old)
DO $$
BEGIN
    -- Drop old auth.users foreign keys if they exist
    ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_requester_id_users_fkey;
    ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_addressee_id_users_fkey;

    -- Ensure correct profile foreign keys exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'connections_requester_id_fkey'
        AND table_name = 'connections'
    ) THEN
        ALTER TABLE connections
        ADD CONSTRAINT connections_requester_id_fkey
        FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed: Added connections_requester_id_fkey to profiles';
    ELSE
        RAISE NOTICE 'OK: connections_requester_id_fkey exists';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'connections_addressee_id_fkey'
        AND table_name = 'connections'
    ) THEN
        ALTER TABLE connections
        ADD CONSTRAINT connections_addressee_id_fkey
        FOREIGN KEY (addressee_id) REFERENCES profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed: Added connections_addressee_id_fkey to profiles';
    ELSE
        RAISE NOTICE 'OK: connections_addressee_id_fkey exists';
    END IF;
END $$;

-- 4. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- 5. VERIFICATION SUMMARY
SELECT
    'opportunities' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'opportunities'
AND column_name IN ('type', 'creator_id', 'opportunity_type', 'posted_by')
ORDER BY column_name;

SELECT
    'profiles' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'industry';

SELECT
    constraint_name,
    table_name
FROM information_schema.table_constraints
WHERE table_name IN ('opportunities', 'connections')
AND constraint_type = 'FOREIGN KEY'
AND constraint_name LIKE '%creator_id%' OR constraint_name LIKE '%requester%' OR constraint_name LIKE '%addressee%'
ORDER BY table_name, constraint_name;
