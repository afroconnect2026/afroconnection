-- Fix RLS policies for messaging system
-- Run this in Supabase SQL Editor

-- ============================================
-- CONVERSATIONS TABLE POLICIES
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;

-- Users can view conversations they're part of
CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
TO authenticated
USING (
  auth.uid() = participant_a_id
  OR auth.uid() = participant_b_id
);

-- Users can create conversations
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = participant_a_id
  OR auth.uid() = participant_b_id
);

-- Users can update conversations they're part of (for updated_at timestamp)
CREATE POLICY "Users can update their own conversations"
ON conversations FOR UPDATE
TO authenticated
USING (
  auth.uid() = participant_a_id
  OR auth.uid() = participant_b_id
);

-- ============================================
-- MESSAGES TABLE POLICIES
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Users can view messages in conversations they're part of
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      conversations.participant_a_id = auth.uid()
      OR conversations.participant_b_id = auth.uid()
    )
  )
);

-- Users can send messages to conversations they're part of
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = conversation_id
    AND (
      conversations.participant_a_id = auth.uid()
      OR conversations.participant_b_id = auth.uid()
    )
  )
);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, DELETE ON messages TO authenticated;
