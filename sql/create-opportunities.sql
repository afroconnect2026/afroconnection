-- Create Opportunities System
-- Run this in Supabase SQL Editor

-- ============================================
-- OPPORTUNITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Who posted this
  posted_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Opportunity Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  opportunity_type TEXT NOT NULL, -- 'job', 'investment', 'partnership', 'mentorship'

  -- Location
  location TEXT,
  is_remote BOOLEAN DEFAULT FALSE,
  country TEXT,

  -- Job-specific fields
  job_type TEXT, -- 'full-time', 'part-time', 'contract', 'internship'
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',

  -- Investment-specific fields
  investment_amount_min INTEGER,
  investment_amount_max INTEGER,
  equity_offered DECIMAL(5,2), -- percentage
  funding_stage TEXT, -- 'pre-seed', 'seed', 'series-a', 'series-b', etc.

  -- General fields
  industry TEXT,
  skills_required TEXT[], -- array of skills
  experience_level TEXT, -- 'entry', 'mid', 'senior', 'executive'

  -- Application details
  application_deadline TIMESTAMPTZ,
  application_url TEXT,
  application_email TEXT,

  -- Metadata
  status TEXT DEFAULT 'active', -- 'active', 'closed', 'draft'
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0
);

-- ============================================
-- OPPORTUNITY APPLICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS opportunity_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Application details
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'accepted', 'rejected'

  -- Prevent duplicate applications
  UNIQUE(opportunity_id, applicant_id)
);

-- ============================================
-- OPPORTUNITY SAVES (BOOKMARKS)
-- ============================================

CREATE TABLE IF NOT EXISTS opportunity_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Prevent duplicate saves
  UNIQUE(opportunity_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_opportunities_posted_by ON opportunities(posted_by);
CREATE INDEX idx_opportunities_type ON opportunities(opportunity_type);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at DESC);
CREATE INDEX idx_opportunities_country ON opportunities(country);
CREATE INDEX idx_opportunities_industry ON opportunities(industry);

CREATE INDEX idx_opportunity_applications_opportunity ON opportunity_applications(opportunity_id);
CREATE INDEX idx_opportunity_applications_applicant ON opportunity_applications(applicant_id);

CREATE INDEX idx_opportunity_saves_user ON opportunity_saves(user_id);
CREATE INDEX idx_opportunity_saves_opportunity ON opportunity_saves(opportunity_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_saves ENABLE ROW LEVEL SECURITY;

-- OPPORTUNITIES POLICIES

-- Everyone can view active opportunities
CREATE POLICY "Everyone can view active opportunities"
ON opportunities FOR SELECT
TO authenticated
USING (status = 'active');

-- Users can view their own opportunities (including drafts)
CREATE POLICY "Users can view their own opportunities"
ON opportunities FOR SELECT
TO authenticated
USING (posted_by = auth.uid());

-- Users can create opportunities
CREATE POLICY "Users can create opportunities"
ON opportunities FOR INSERT
TO authenticated
WITH CHECK (posted_by = auth.uid());

-- Users can update their own opportunities
CREATE POLICY "Users can update their own opportunities"
ON opportunities FOR UPDATE
TO authenticated
USING (posted_by = auth.uid());

-- Users can delete their own opportunities
CREATE POLICY "Users can delete their own opportunities"
ON opportunities FOR DELETE
TO authenticated
USING (posted_by = auth.uid());

-- APPLICATIONS POLICIES

-- Users can view applications to their opportunities
CREATE POLICY "Users can view applications to their opportunities"
ON opportunity_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM opportunities
    WHERE opportunities.id = opportunity_applications.opportunity_id
    AND opportunities.posted_by = auth.uid()
  )
);

-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
ON opportunity_applications FOR SELECT
TO authenticated
USING (applicant_id = auth.uid());

-- Users can create applications
CREATE POLICY "Users can create applications"
ON opportunity_applications FOR INSERT
TO authenticated
WITH CHECK (applicant_id = auth.uid());

-- Users can update their own applications
CREATE POLICY "Users can update their own applications"
ON opportunity_applications FOR UPDATE
TO authenticated
USING (applicant_id = auth.uid());

-- Opportunity owners can update application status
CREATE POLICY "Opportunity owners can update application status"
ON opportunity_applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM opportunities
    WHERE opportunities.id = opportunity_applications.opportunity_id
    AND opportunities.posted_by = auth.uid()
  )
);

-- SAVES POLICIES

-- Users can view their own saves
CREATE POLICY "Users can view their own saves"
ON opportunity_saves FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create saves
CREATE POLICY "Users can create saves"
ON opportunity_saves FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can delete their own saves
CREATE POLICY "Users can delete their own saves"
ON opportunity_saves FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON opportunity_applications TO authenticated;
GRANT SELECT, INSERT, DELETE ON opportunity_saves TO authenticated;

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

-- Function likely already exists, only create if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $func$ language 'plpgsql';
  END IF;
END
$$;

-- Drop existing trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
