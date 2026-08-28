-- =====================================================
-- SCHEMA ADDITIONS FOR TYPE-SPECIFIC DASHBOARDS
-- 5 new tables to power personalized experiences
-- =====================================================

-- 1. PROFILE VIEWS (who viewed me)
-- Powers: "Investor Views" for entrepreneurs, "Who Viewed You" for professionals
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT, -- 'explore', 'search', 'match_feed', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate views on the same day (allow repeat views across days).
-- NOTE: Postgres does NOT allow expressions inside a UNIQUE table constraint,
-- so this must be a functional UNIQUE INDEX, not CONSTRAINT ... UNIQUE (..., DATE(created_at)).
DROP INDEX IF EXISTS no_duplicate_view_per_day;
CREATE UNIQUE INDEX IF NOT EXISTS no_duplicate_view_per_day
  ON profile_views (viewer_id, viewed_id, (created_at::date));

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_id ON profile_views(viewed_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON profile_views(viewer_id, created_at DESC);

-- RLS: Insert by any authenticated user, select only your own received views
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can record profile views" ON profile_views;
CREATE POLICY "Anyone can record profile views"
  ON profile_views FOR INSERT
  TO authenticated
  WITH CHECK (viewer_id = auth.uid());

DROP POLICY IF EXISTS "Users can see who viewed them" ON profile_views;
CREATE POLICY "Users can see who viewed them"
  ON profile_views FOR SELECT
  TO authenticated
  USING (viewed_id = auth.uid());

-- =====================================================

-- 2. OPPORTUNITY APPLICATIONS (job/gig/raise applications)
-- Powers: Applicant tracking, hiring pipeline, gig applications
CREATE TABLE IF NOT EXISTS opportunity_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted', -- 'submitted', 'viewed', 'shortlisted', 'interviewing', 'hired', 'rejected'
  cover_note TEXT,
  resume_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One application per user per opportunity
  CONSTRAINT unique_application UNIQUE (opportunity_id, applicant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON opportunity_applications(opportunity_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON opportunity_applications(applicant_id, created_at DESC);

-- RLS: Applicants can see their own, opportunity creators can see applications to their posts
ALTER TABLE opportunity_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create applications" ON opportunity_applications;
CREATE POLICY "Users can create applications"
  ON opportunity_applications FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Users can view relevant applications" ON opportunity_applications;
CREATE POLICY "Users can view relevant applications"
  ON opportunity_applications FOR SELECT
  TO authenticated
  USING (
    applicant_id = auth.uid() OR
    opportunity_id IN (SELECT id FROM opportunities WHERE creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "Opportunity creators can update application status" ON opportunity_applications;
CREATE POLICY "Opportunity creators can update application status"
  ON opportunity_applications FOR UPDATE
  TO authenticated
  USING (opportunity_id IN (SELECT id FROM opportunities WHERE creator_id = auth.uid()));

-- =====================================================

-- 3. SAVED ITEMS (watchlists, talent pools, saved deals)
-- Powers: Investor watchlists, company talent pools, saved opportunities
CREATE TABLE IF NOT EXISTS saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL, -- 'profile', 'opportunity', 'match'
  target_id UUID NOT NULL, -- ID of the saved item
  note TEXT, -- Private note about why saved
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One save per target per user
  CONSTRAINT unique_saved_item UNIQUE (user_id, target_type, target_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id, target_type, created_at DESC);

-- RLS: Users can only manage their own saved items
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own saved items" ON saved_items;
CREATE POLICY "Users manage their own saved items"
  ON saved_items FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================

-- 4. ADD PIPELINE COLUMNS TO MATCHES
-- Powers: Fundraising pipeline, deal stages
-- NOTE: `matches` was created WITHOUT an updated_at column, so it is added here
-- before the pipeline index references it.
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'matched', -- 'matched', 'contacted', 'in_diligence', 'committed', 'passed'
  ADD COLUMN IF NOT EXISTS pass_reason TEXT, -- Why investor passed (for training AI)
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_matches_pipeline ON matches(pipeline_stage, updated_at DESC);

-- =====================================================

-- 5. ENDORSEMENTS (professional credibility)
-- Powers: Professional dashboard credibility builder
CREATE TABLE IF NOT EXISTS endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill TEXT NOT NULL, -- What skill/expertise being endorsed
  note TEXT, -- Optional testimonial
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One endorsement per skill per endorser-professional pair
  CONSTRAINT unique_endorsement UNIQUE (endorser_id, professional_id, skill),

  -- No self-endorsements
  CONSTRAINT no_self_endorsement CHECK (endorser_id != professional_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_endorsements_professional ON endorsements(professional_id, created_at DESC);

-- RLS: Public read, authenticated write (no self-endorsements enforced by constraint)
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view endorsements" ON endorsements;
CREATE POLICY "Anyone can view endorsements"
  ON endorsements FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can endorse others" ON endorsements;
CREATE POLICY "Users can endorse others"
  ON endorsements FOR INSERT
  TO authenticated
  WITH CHECK (endorser_id = auth.uid() AND endorser_id != professional_id);

-- =====================================================

-- 6. HELPER COLUMNS (small additions to existing tables)

-- Add timezone to profiles (for professional matching)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add pitch deck URL to entrepreneur profiles
ALTER TABLE entrepreneur_profiles
  ADD COLUMN IF NOT EXISTS pitch_deck_url TEXT;

-- Add views count to opportunities (already has applications_count)
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Add an availability flag for professionals (powers the dashboard toggle).
-- `available_for TEXT[]` describes WHAT they are open to; this is the on/off switch.
ALTER TABLE professional_profiles
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;

-- opportunity_applications needs the updated_at trigger it declares a column for
DROP TRIGGER IF EXISTS update_opportunity_applications_updated_at ON opportunity_applications;
CREATE TRIGGER update_opportunity_applications_updated_at
  BEFORE UPDATE ON opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONE: All 5 tables + helper columns added
-- Ready for type-specific dashboards
-- =====================================================
