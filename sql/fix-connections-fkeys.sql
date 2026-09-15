-- Fix connections table foreign keys to point to profiles instead of auth.users
-- This allows PostgREST to properly join connections with profile data

-- First, drop the existing foreign keys to auth.users
ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_requester_id_fkey;
ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_addressee_id_fkey;

-- Add foreign keys to profiles table (which has id matching auth.users.id)
ALTER TABLE connections
ADD CONSTRAINT connections_requester_id_fkey
FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE connections
ADD CONSTRAINT connections_addressee_id_fkey
FOREIGN KEY (addressee_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';
