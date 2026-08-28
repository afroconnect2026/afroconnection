-- =====================================================
-- FIX UNIQUE CONSTRAINTS
-- Prevent duplicate conversations and matches
-- =====================================================

-- Drop existing constraints
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_a_id_participant_b_id_key;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user_a_id_user_b_id_key;

-- Add proper unique constraints using LEAST/GREATEST
-- This prevents both (A,B) and (B,A) from existing

-- Fix conversations table
ALTER TABLE conversations
  ADD CONSTRAINT conversations_unique_pair
  CHECK (participant_a_id < participant_b_id);

ALTER TABLE conversations
  ADD CONSTRAINT conversations_canonical_unique
  UNIQUE (LEAST(participant_a_id, participant_b_id), GREATEST(participant_a_id, participant_b_id));

-- Fix matches table
ALTER TABLE matches
  ADD CONSTRAINT matches_unique_pair
  CHECK (user_a_id < user_b_id);

ALTER TABLE matches
  ADD CONSTRAINT matches_canonical_unique
  UNIQUE (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id));

-- =====================================================
-- DONE: Conversations and matches now prevent duplicates
-- Both (A,B) and (B,A) combinations are handled
-- =====================================================
