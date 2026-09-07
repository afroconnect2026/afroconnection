-- =====================================================
-- CONNECTIONS TABLE
-- =====================================================
-- Professional networking connections between users
-- Supports connection requests, acceptance, and rejection
-- =====================================================

-- Create connections table
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The user who sent the connection request
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The user who received the connection request
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Connection status: pending, accepted, declined
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),

  -- Optional message when sending connection request
  request_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT no_self_connection CHECK (requester_id != addressee_id),
  CONSTRAINT unique_connection UNIQUE (requester_id, addressee_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for finding all connections for a user (both sent and received)
CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_addressee ON connections(addressee_id);

-- Index for finding pending requests
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);

-- Composite index for checking connection status between two users
CREATE INDEX IF NOT EXISTS idx_connections_users ON connections(requester_id, addressee_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own connections (sent or received)
CREATE POLICY "Users can view their own connections"
  ON connections
  FOR SELECT
  USING (
    auth.uid() = requester_id
    OR auth.uid() = addressee_id
  );

-- Policy: Users can send connection requests
CREATE POLICY "Users can send connection requests"
  ON connections
  FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id
    AND auth.uid() != addressee_id
  );

-- Policy: Users can update connections they received (accept/decline)
CREATE POLICY "Users can respond to connection requests"
  ON connections
  FOR UPDATE
  USING (
    auth.uid() = addressee_id
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = addressee_id
    AND status IN ('accepted', 'declined')
  );

-- Policy: Users can delete connections they sent (if still pending)
CREATE POLICY "Users can cancel pending requests"
  ON connections
  FOR DELETE
  USING (
    auth.uid() = requester_id
    AND status = 'pending'
  );

-- Policy: Users can delete accepted connections (unfriend)
CREATE POLICY "Users can remove connections"
  ON connections
  FOR DELETE
  USING (
    (auth.uid() = requester_id OR auth.uid() = addressee_id)
    AND status = 'accepted'
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if two users are connected
CREATE OR REPLACE FUNCTION are_users_connected(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM connections
    WHERE status = 'accepted'
    AND (
      (requester_id = user_a AND addressee_id = user_b)
      OR (requester_id = user_b AND addressee_id = user_a)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get connection status between two users
CREATE OR REPLACE FUNCTION get_connection_status(user_a UUID, user_b UUID)
RETURNS TEXT AS $$
DECLARE
  conn_status TEXT;
BEGIN
  SELECT status INTO conn_status
  FROM connections
  WHERE (
    (requester_id = user_a AND addressee_id = user_b)
    OR (requester_id = user_b AND addressee_id = user_a)
  )
  LIMIT 1;

  RETURN COALESCE(conn_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connections_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE connections IS 'Professional networking connections between users';
COMMENT ON COLUMN connections.requester_id IS 'User who sent the connection request';
COMMENT ON COLUMN connections.addressee_id IS 'User who received the connection request';
COMMENT ON COLUMN connections.status IS 'Connection status: pending, accepted, or declined';
COMMENT ON COLUMN connections.request_message IS 'Optional message when sending connection request';
