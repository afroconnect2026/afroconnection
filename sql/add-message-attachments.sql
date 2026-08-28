-- Add message attachments support
-- Run this in Supabase SQL Editor

-- ============================================
-- MESSAGE ATTACHMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relationships
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- File Details
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,  -- image/jpeg, application/pdf, etc.
  file_size BIGINT NOT NULL, -- in bytes
  file_url TEXT NOT NULL,    -- Supabase Storage URL

  -- Image-specific (if applicable)
  is_image BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX idx_message_attachments_uploaded_by ON message_attachments(uploaded_by);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments in their conversations
CREATE POLICY "Users can view attachments in their conversations"
ON message_attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM messages
    JOIN conversations ON conversations.id = messages.conversation_id
    WHERE messages.id = message_attachments.message_id
    AND (
      conversations.participant_a_id = auth.uid()
      OR conversations.participant_b_id = auth.uid()
    )
  )
);

-- Users can upload attachments to their messages
CREATE POLICY "Users can upload attachments"
ON message_attachments FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM messages
    JOIN conversations ON conversations.id = messages.conversation_id
    WHERE messages.id = message_id
    AND (
      conversations.participant_a_id = auth.uid()
      OR conversations.participant_b_id = auth.uid()
    )
  )
);

-- Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
ON message_attachments FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid());

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Create message-attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message-attachments bucket
CREATE POLICY "Attachments are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'message-attachments');

CREATE POLICY "Users can upload attachments to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT, INSERT, DELETE ON message_attachments TO authenticated;
