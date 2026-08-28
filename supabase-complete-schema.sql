-- =====================================================
-- AFROCONNECT - PROFESSIONAL NETWORKING PLATFORM
-- Complete Database Schema for Supabase
--
-- Purpose: Connect African entrepreneurs, global investors,
--          diaspora professionals, and business opportunities
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Main User Profiles Table
-- Stores common profile data for all user types
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('entrepreneur', 'investor', 'professional', 'company')),
  country TEXT,
  city TEXT,
  phone TEXT,
  website_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Entrepreneur Profiles
-- For startup founders and business builders
CREATE TABLE IF NOT EXISTS entrepreneur_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Business Information
  company_name TEXT,
  company_description TEXT,
  industry TEXT[] DEFAULT '{}',
  startup_stage TEXT CHECK (startup_stage IN ('idea', 'mvp', 'early', 'growth', 'scale')),
  founded_year INT,
  team_size INT,

  -- Funding Information
  funding_stage TEXT CHECK (funding_stage IN ('bootstrapped', 'pre-seed', 'seed', 'series-a', 'series-b', 'series-c+')),
  revenue_range TEXT,

  -- Skills & Experience
  skills TEXT[] DEFAULT '{}',
  experience_years INT,

  -- Networking Needs
  looking_for TEXT[] DEFAULT '{}' -- ['cofounder', 'investor', 'mentor', 'talent', 'partner']
);

-- Investor Profiles
-- For angel investors, VCs, and investment firms
CREATE TABLE IF NOT EXISTS investor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Investment Focus
  investment_focus TEXT[] DEFAULT '{}', -- industries of interest
  investment_stage TEXT[] DEFAULT '{}', -- ['pre-seed', 'seed', 'series-a', 'series-b', etc]

  -- Investment Capacity
  ticket_size_min NUMERIC(15,2),
  ticket_size_max NUMERIC(15,2),
  currency TEXT DEFAULT 'USD',

  -- Geographic Focus
  regions_of_interest TEXT[] DEFAULT '{}', -- African countries/regions + global

  -- Portfolio & Credibility
  portfolio_companies INT DEFAULT 0,
  successful_exits INT DEFAULT 0,
  verified_investor BOOLEAN DEFAULT FALSE,
  investment_thesis TEXT
);

-- Professional Profiles
-- For consultants, advisors, and service providers
CREATE TABLE IF NOT EXISTS professional_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Professional Information
  job_title TEXT,
  expertise TEXT[] DEFAULT '{}', -- skills/areas of expertise
  years_of_experience INT,

  -- Service Offerings
  available_for TEXT[] DEFAULT '{}', -- ['consulting', 'mentorship', 'employment', 'advisory', 'speaking']
  hourly_rate NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',

  -- Qualifications
  languages TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  education TEXT
);

-- Company Profiles
-- For established businesses and organizations
CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Company Information
  company_name TEXT NOT NULL,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  industry TEXT[] DEFAULT '{}',
  founded_year INT,
  headquarters TEXT,
  website_url TEXT NOT NULL,
  description TEXT,

  -- Engagement
  hiring BOOLEAN DEFAULT FALSE,
  open_to_partnerships BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- NETWORKING & OPPORTUNITIES
-- =====================================================

-- Opportunities Table
-- Jobs, investments, partnerships, mentorship, cofounder searches
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Creator
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Opportunity Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('investment', 'partnership', 'mentorship', 'job', 'cofounder', 'advisor')),

  -- Targeting
  industry TEXT[] DEFAULT '{}',
  location TEXT,
  remote_ok BOOLEAN DEFAULT FALSE,

  -- Financials (if applicable)
  budget_min NUMERIC(15,2),
  budget_max NUMERIC(15,2),
  currency TEXT DEFAULT 'USD',

  -- Status & Metrics
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  expires_at TIMESTAMPTZ,
  views_count INT DEFAULT 0,
  applications_count INT DEFAULT 0
);

-- AI-Powered Matches
-- Connects users based on compatibility
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Matched Users
  user_a_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Match Quality
  match_score NUMERIC(3,2) CHECK (match_score >= 0 AND match_score <= 1), -- 0.00 to 1.00
  match_reason TEXT, -- AI explanation
  match_type TEXT CHECK (match_type IN ('cofounder', 'investor-founder', 'mentor-mentee', 'partnership', 'hiring')),

  -- Engagement
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  viewed_by_a BOOLEAN DEFAULT FALSE,
  viewed_by_b BOOLEAN DEFAULT FALSE,

  UNIQUE(user_a_id, user_b_id)
);

-- =====================================================
-- MESSAGING SYSTEM
-- =====================================================

-- Conversations
-- Message threads between users
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Participants
  participant_a_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  participant_b_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Metadata
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,

  UNIQUE(participant_a_id, participant_b_id)
);

-- Messages
-- Individual messages within conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Message Details
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_entrepreneur_profiles_user_id ON entrepreneur_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_entrepreneur_profiles_startup_stage ON entrepreneur_profiles(startup_stage);

CREATE INDEX IF NOT EXISTS idx_investor_profiles_user_id ON investor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_verified ON investor_profiles(verified_investor);

CREATE INDEX IF NOT EXISTS idx_professional_profiles_user_id ON professional_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON company_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_creator_id ON opportunities(creator_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);

CREATE INDEX IF NOT EXISTS idx_matches_user_a_id ON matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b_id ON matches(user_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_a_id ON conversations(participant_a_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_b_id ON conversations(participant_b_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Profiles: viewable by all, editable by owner
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Entrepreneur Profiles
ALTER TABLE entrepreneur_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Entrepreneur profiles viewable by everyone" ON entrepreneur_profiles;
CREATE POLICY "Entrepreneur profiles viewable by everyone"
  ON entrepreneur_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own entrepreneur profile" ON entrepreneur_profiles;
CREATE POLICY "Users can update own entrepreneur profile"
  ON entrepreneur_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own entrepreneur profile" ON entrepreneur_profiles;
CREATE POLICY "Users can insert own entrepreneur profile"
  ON entrepreneur_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Investor Profiles
ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Investor profiles viewable by everyone" ON investor_profiles;
CREATE POLICY "Investor profiles viewable by everyone"
  ON investor_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own investor profile" ON investor_profiles;
CREATE POLICY "Users can update own investor profile"
  ON investor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own investor profile" ON investor_profiles;
CREATE POLICY "Users can insert own investor profile"
  ON investor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Professional Profiles
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professional profiles viewable by everyone" ON professional_profiles;
CREATE POLICY "Professional profiles viewable by everyone"
  ON professional_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own professional profile" ON professional_profiles;
CREATE POLICY "Users can update own professional profile"
  ON professional_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own professional profile" ON professional_profiles;
CREATE POLICY "Users can insert own professional profile"
  ON professional_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Company Profiles
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company profiles viewable by everyone" ON company_profiles;
CREATE POLICY "Company profiles viewable by everyone"
  ON company_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own company profile" ON company_profiles;
CREATE POLICY "Users can update own company profile"
  ON company_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own company profile" ON company_profiles;
CREATE POLICY "Users can insert own company profile"
  ON company_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Opportunities
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Opportunities viewable by everyone" ON opportunities;
CREATE POLICY "Opportunities viewable by everyone"
  ON opportunities FOR SELECT
  USING (status = 'active' OR creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can create opportunities" ON opportunities;
CREATE POLICY "Users can create opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update own opportunities" ON opportunities;
CREATE POLICY "Users can update own opportunities"
  ON opportunities FOR UPDATE
  USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can delete own opportunities" ON opportunities;
CREATE POLICY "Users can delete own opportunities"
  ON opportunities FOR DELETE
  USING (auth.uid() = creator_id);

-- Matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
CREATE POLICY "Users can view their own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

DROP POLICY IF EXISTS "System can create matches" ON matches;
CREATE POLICY "System can create matches"
  ON matches FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update match status" ON matches;
CREATE POLICY "Users can update match status"
  ON matches FOR UPDATE
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their received messages" ON messages;
CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant_a_id OR auth.uid() = participant_b_id);

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_a_id OR auth.uid() = participant_b_id);

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entrepreneur_profiles_updated_at ON entrepreneur_profiles;
CREATE TRIGGER update_entrepreneur_profiles_updated_at
  BEFORE UPDATE ON entrepreneur_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investor_profiles_updated_at ON investor_profiles;
CREATE TRIGGER update_investor_profiles_updated_at
  BEFORE UPDATE ON investor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_professional_profiles_updated_at ON professional_profiles;
CREATE TRIGGER update_professional_profiles_updated_at
  BEFORE UPDATE ON professional_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_profiles_updated_at ON company_profiles;
CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CRITICAL: Auto-create profile on user signup
-- =====================================================

-- Function: Handle new user registration
-- Creates profile automatically when user signs up
-- This solves RLS policy issues with client-side profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    user_type,
    is_active,
    is_verified,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'entrepreneur'),
    true,
    false,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Execute handle_new_user after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- All tables, indexes, RLS policies, and triggers created
-- AfroConnect database is production-ready
-- =====================================================
