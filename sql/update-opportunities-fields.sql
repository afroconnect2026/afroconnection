-- Add type-specific contextual fields to opportunities table
-- Run this in Supabase SQL Editor

-- Add Job-specific fields
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS benefits TEXT[]; -- array of benefits
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS required_experience_years INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS education_required TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS team_size TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS work_schedule TEXT;

-- Add Investment-specific fields
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS company_description TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS business_model TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS current_revenue INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS revenue_model TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS team_members INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS use_of_funds TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS looking_for TEXT; -- what kind of investor
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS traction TEXT; -- users, revenue, growth metrics

-- Add Partnership-specific fields
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS partner_type TEXT; -- co-founder, business partner, etc.
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS what_we_bring TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS what_we_need TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS commitment_required TEXT; -- full-time, part-time, etc.
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS equity_split TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS partnership_duration TEXT;

-- Add Mentorship-specific fields
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS mentorship_areas TEXT[]; -- array of areas
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS session_format TEXT; -- 1-on-1, group, online, in-person
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS session_frequency TEXT; -- weekly, bi-weekly, monthly
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS session_duration TEXT; -- 30min, 1hr, etc.
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS mentor_experience_years INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS mentorship_goals TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS ideal_mentee TEXT;
