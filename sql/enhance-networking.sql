-- Drop existing event_networking table and recreate with better structure
DROP TABLE IF EXISTS event_networking CASCADE;

-- Enhanced Event Networking/Connections Table
CREATE TABLE event_networking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate connections
  UNIQUE(event_id, sender_id, receiver_id),
  -- Prevent self-connections
  CHECK (sender_id != receiver_id)
);

-- Indexes for performance
CREATE INDEX idx_networking_event ON event_networking(event_id);
CREATE INDEX idx_networking_sender ON event_networking(sender_id);
CREATE INDEX idx_networking_receiver ON event_networking(receiver_id);
CREATE INDEX idx_networking_status ON event_networking(status);

-- RLS Policies
ALTER TABLE event_networking ENABLE ROW LEVEL SECURITY;

-- Users can view connections they're part of
CREATE POLICY "Users can view their connections"
  ON event_networking FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send connection requests
CREATE POLICY "Users can send connection requests"
  ON event_networking FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM event_rsvps
      WHERE event_id = event_networking.event_id
      AND user_id = auth.uid()
    )
  );

-- Users can update connections they received
CREATE POLICY "Users can update received connections"
  ON event_networking FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Users can delete connections they're part of
CREATE POLICY "Users can delete their connections"
  ON event_networking FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Event organizers can view all connections
CREATE POLICY "Organizers can view all connections"
  ON event_networking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
      AND organizer_id = auth.uid()
    )
  );

-- Function to auto-update responded_at when status changes
CREATE OR REPLACE FUNCTION update_networking_responded_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('accepted', 'rejected') THEN
    NEW.responded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_networking_responded_at
  BEFORE UPDATE ON event_networking
  FOR EACH ROW
  EXECUTE FUNCTION update_networking_responded_at();

-- Updated timestamp trigger
CREATE TRIGGER update_networking_updated_at
  BEFORE UPDATE ON event_networking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View for easy connection queries with user profiles
CREATE OR REPLACE VIEW event_connections_view AS
SELECT
  en.*,
  sender.id as sender_profile_id,
  sender.full_name as sender_name,
  sender.avatar_url as sender_avatar,
  sender.country as sender_country,
  sender.bio as sender_bio,
  sender.linkedin_url as sender_linkedin,
  receiver.id as receiver_profile_id,
  receiver.full_name as receiver_name,
  receiver.avatar_url as receiver_avatar,
  receiver.country as receiver_country,
  receiver.bio as receiver_bio,
  receiver.linkedin_url as receiver_linkedin
FROM event_networking en
LEFT JOIN profiles sender ON en.sender_id = sender.id
LEFT JOIN profiles receiver ON en.receiver_id = receiver.id;
