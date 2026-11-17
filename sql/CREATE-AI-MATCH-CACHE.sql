-- =====================================================
-- AI MATCH CACHE TABLE
-- =====================================================
-- Caches AI profile compatibility results to reduce costs
-- Results expire after 1 hour
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_match_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_pair TEXT UNIQUE NOT NULL, -- Sorted pair like "uuid1:uuid2"
  user_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_match_cache_pair ON ai_match_cache(user_pair);
CREATE INDEX IF NOT EXISTS idx_ai_match_cache_expires ON ai_match_cache(expires_at);

-- RLS policies - only allow service role to write (API endpoint only)
ALTER TABLE ai_match_cache ENABLE ROW LEVEL SECURITY;

-- Users can read their own cached matches
CREATE POLICY "Users can read own cached matches"
  ON ai_match_cache
  FOR SELECT
  TO authenticated
  USING (user_a_id = auth.uid() OR user_b_id = auth.uid());

-- Only the API (service role) can write
-- Note: The API endpoint handles all writes

-- Clean up expired cache entries (run this periodically via cron or manually)
CREATE OR REPLACE FUNCTION clean_expired_ai_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_match_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Set up a cron job to clean cache daily
-- (Requires pg_cron extension)
-- SELECT cron.schedule('clean-ai-cache', '0 2 * * *', 'SELECT clean_expired_ai_cache()');

COMMENT ON TABLE ai_match_cache IS 'Caches AI profile compatibility analysis results to reduce OpenAI costs';
COMMENT ON COLUMN ai_match_cache.user_pair IS 'Sorted pair of user IDs (uuid1:uuid2) for unique constraint';
COMMENT ON COLUMN ai_match_cache.expires_at IS 'Cache expiry time (1 hour from creation)';
