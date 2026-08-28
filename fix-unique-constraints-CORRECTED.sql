-- =====================================================
-- FIX UNIQUE CONSTRAINTS (CORRECTED VERSION)
-- Prevent duplicate conversations and matches
-- Uses functional indexes instead of table constraints
-- =====================================================

-- Drop existing constraints if any
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_a_id_participant_b_id_key;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user_a_id_user_b_id_key;

-- Fix conversations table with functional unique index
DROP INDEX IF EXISTS conversations_canonical_unique;
CREATE UNIQUE INDEX IF NOT EXISTS conversations_canonical_unique
  ON conversations (LEAST(participant_a_id, participant_b_id), GREATEST(participant_a_id, participant_b_id));

-- Fix matches table with functional unique index
DROP INDEX IF EXISTS matches_canonical_unique;
CREATE UNIQUE INDEX IF NOT EXISTS matches_canonical_unique
  ON matches (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id));

-- =====================================================
-- DONE: Conversations and matches now prevent duplicates
-- Both (A,B) and (B,A) combinations are handled
-- No CHECK constraints needed - functional indexes handle it
-- =====================================================
