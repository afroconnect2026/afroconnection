-- AfroConnect Database Schema for Supabase
-- Run this in your Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles (main table for all users)
CREATE TABLE profiles (
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
  website TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Entrepreneur Profiles
CREATE TABLE entrepreneur_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  industry TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  experience_years INT,
  looking_for TEXT[] DEFAULT '{}', -- ['cofounder', 'investor', 'mentor', 'talent']
  startup_stage TEXT, -- 'idea', 'mvp', 'early', 'growth', 'scale'
  company_name TEXT,
  company_description TEXT,
  funding_stage TEXT, -- 'bootstrapped', 'pre-seed', 'seed', 'series-a', etc
  team_size INT,
  revenue_range TEXT,
  UNIQUE(user_id)
);

-- Investor Profiles
CREATE TABLE investor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  investment_focus TEXT[] DEFAULT '{}', -- industries
  investment_stage TEXT[] DEFAULT '{}', -- ['pre-seed', 'seed', 'series-a']
  ticket_size_min NUMERIC(15,2),
  ticket_size_max NUMERIC(15,2),
  regions_of_interest TEXT[] DEFAULT '{}', -- African countries/regions
  portfolio_companies INT,
  verified_investor BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id)
);

-- Professional Profiles
CREATE TABLE professional_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  job_title TEXT,
  expertise TEXT[] DEFAULT '{}',
  years_of_experience INT,
  available_for TEXT[] DEFAULT '{}', -- ['consulting', 'mentorship', 'employment', 'advisory']
  hourly_rate NUMERIC(10,2),
  languages TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  UNIQUE(user_id)
);

-- Company Profiles
CREATE TABLE company_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  company_name TEXT NOT NULL,
  company_size TEXT, -- '1-10', '11-50', '51-200', etc
  industry TEXT[] DEFAULT '{}',
  founded_year INT,
  headquarters TEXT,
  website TEXT NOT NULL,
  description TEXT,
  hiring BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id)
);

-- Opportunities (jobs, investments, partnerships, etc)
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('investment', 'partnership', 'mentorship', 'job', 'cofounder')),
  industry TEXT[] DEFAULT '{}',
  location TEXT,
  remote_ok BOOLEAN DEFAULT FALSE,
  budget_min NUMERIC(15,2),
  budget_max NUMERIC(15,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  expires_at TIMESTAMPTZ,
  views_count INT DEFAULT 0,
  applications_count INT DEFAULT 0
);

-- Matches (AI-generated matches between users)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_a_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_score NUMERIC(3,2) CHECK (match_score >= 0 AND match_score <= 1), -- 0.00 to 1.00
  match_reason TEXT, -- AI explanation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  viewed_by_a BOOLEAN DEFAULT FALSE,
  viewed_by_b BOOLEAN DEFAULT FALSE,
  UNIQUE(user_a_id, user_b_id)
);

-- Messages (conversations between users)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  conversation_id UUID NOT NULL -- group messages by conversation
);

-- Conversations (to track message threads)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  participant_a_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  participant_b_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_a_id, participant_b_id)
);

-- Create indexes for performance
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_country ON profiles(country);
CREATE INDEX idx_entrepreneur_profiles_user_id ON entrepreneur_profiles(user_id);
CREATE INDEX idx_investor_profiles_user_id ON investor_profiles(user_id);
CREATE INDEX idx_professional_profiles_user_id ON professional_profiles(user_id);
CREATE INDEX idx_company_profiles_user_id ON company_profiles(user_id);
CREATE INDEX idx_opportunities_creator_id ON opportunities(creator_id);
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_matches_user_a_id ON matches(user_a_id);
CREATE INDEX idx_matches_user_b_id ON matches(user_b_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_conversations_participant_a_id ON conversations(participant_a_id);
CREATE INDEX idx_conversations_participant_b_id ON conversations(participant_b_id);

-- Row Level Security (RLS) Policies

-- Profiles: users can read all, update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Entrepreneur Profiles
ALTER TABLE entrepreneur_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entrepreneur profiles viewable by everyone"
  ON entrepreneur_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own entrepreneur profile"
  ON entrepreneur_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entrepreneur profile"
  ON entrepreneur_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Similar RLS for other profile types
ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investor profiles viewable by everyone" ON investor_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own investor profile" ON investor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investor profile" ON investor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professional profiles viewable by everyone" ON professional_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own professional profile" ON professional_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own professional profile" ON professional_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company profiles viewable by everyone" ON company_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own company profile" ON company_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own company profile" ON company_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Opportunities
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Opportunities viewable by everyone" ON opportunities FOR SELECT USING (status = 'active' OR creator_id = auth.uid());
CREATE POLICY "Users can create opportunities" ON opportunities FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own opportunities" ON opportunities FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own opportunities" ON opportunities FOR DELETE USING (auth.uid() = creator_id);

-- Matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own matches" ON matches FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
CREATE POLICY "System can create matches" ON matches FOR INSERT WITH CHECK (true); -- Will be created by Edge Function
CREATE POLICY "Users can update match status" ON matches FOR UPDATE USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their received messages" ON messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (auth.uid() = participant_a_id OR auth.uid() = participant_b_id);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = participant_a_id OR auth.uid() = participant_b_id);

-- Functions

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entrepreneur_profiles_updated_at BEFORE UPDATE ON entrepreneur_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investor_profiles_updated_at BEFORE UPDATE ON investor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professional_profiles_updated_at BEFORE UPDATE ON professional_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_profiles_updated_at BEFORE UPDATE ON company_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage buckets (run these in Supabase Dashboard -> Storage)
-- Bucket: avatars (public)
-- Bucket: company-logos (public)
-- Bucket: documents (private - for pitch decks, business plans)
