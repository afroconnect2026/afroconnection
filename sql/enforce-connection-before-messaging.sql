-- Enforce connection requirement before messaging
-- SECURITY FIX: Prevent users from creating conversations with non-connected users
-- Run this in Supabase SQL Editor

-- ============================================
-- DROP OLD POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- ============================================
-- NEW SECURE POLICY
-- ============================================

-- Users can only create conversations with users they're connected to
CREATE POLICY "Users can create conversations with connections"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be one of the participants
  (auth.uid() = participant_a_id OR auth.uid() = participant_b_id)
  AND
  -- The two participants must be connected
  EXISTS (
    SELECT 1 FROM connections
    WHERE status = 'accepted'
    AND (
      (requester_id = participant_a_id AND addressee_id = participant_b_id)
      OR
      (requester_id = participant_b_id AND addressee_id = participant_a_id)
    )
  )
);

-- ============================================
-- VALIDATION FUNCTION (Optional - for application use)
-- ============================================

-- Function to check if a user can message another user
CREATE OR REPLACE FUNCTION can_message_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM connections
    WHERE status = 'accepted'
    AND (
      (requester_id = auth.uid() AND addressee_id = target_user_id)
      OR
      (requester_id = target_user_id AND addressee_id = auth.uid())
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON POLICY "Users can create conversations with connections" ON conversations IS
  'Enforces that users can only create conversations with users they are connected to (status = accepted)';

COMMENT ON FUNCTION can_message_user IS
  'Returns TRUE if the current user has an accepted connection with the target user';
