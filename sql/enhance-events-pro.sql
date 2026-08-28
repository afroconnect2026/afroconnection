-- Professional Events System Enhancement
-- Adds ticket types, schedule, speakers, reviews, materials, waitlist, promo codes, networking
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. TICKET TYPES (Multiple ticket tiers)
-- ============================================
CREATE TABLE IF NOT EXISTS event_ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'Early Bird', 'VIP', 'General Admission'
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  quantity_total INTEGER, -- null = unlimited
  quantity_sold INTEGER DEFAULT 0,
  sales_start TIMESTAMP WITH TIME ZONE,
  sales_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  benefits TEXT[], -- ['Front row seating', 'Networking dinner', etc]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. EVENT SCHEDULE/AGENDA
-- ============================================
CREATE TABLE IF NOT EXISTS event_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  speaker_name TEXT,
  speaker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT, -- 'Main Hall', 'Room A', 'Virtual Room 1'
  session_type TEXT, -- 'keynote', 'panel', 'workshop', 'break', 'networking'
  is_break BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. SPEAKERS
-- ============================================
CREATE TABLE IF NOT EXISTS event_speakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT, -- 'CEO', 'Keynote Speaker'
  company TEXT,
  bio TEXT,
  photo_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. EVENT REVIEWS/RATINGS
-- ============================================
CREATE TABLE IF NOT EXISTS event_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id) -- One review per user per event
);

-- ============================================
-- 5. EVENT MATERIALS (Recordings, slides, etc)
-- ============================================
CREATE TABLE IF NOT EXISTS event_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT, -- 'video', 'pdf', 'slides', 'document'
  file_size BIGINT, -- bytes
  is_public BOOLEAN DEFAULT false, -- false = only attendees can access
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. WAITLIST
-- ============================================
CREATE TABLE IF NOT EXISTS event_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- Queue position
  notified BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Offer expires
  UNIQUE(event_id, user_id)
);

-- ============================================
-- 7. PROMO CODES
-- ============================================
CREATE TABLE IF NOT EXISTS event_promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER, -- null = unlimited
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, code)
);

-- ============================================
-- 8. CUSTOM REGISTRATION QUESTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS event_custom_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'text', 'textarea', 'choice', 'multiple_choice'
  options TEXT[], -- For choice/multiple_choice
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. REGISTRATION ANSWERS
-- ============================================
CREATE TABLE IF NOT EXISTS event_registration_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rsvp_id UUID NOT NULL REFERENCES event_rsvps(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES event_custom_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. EVENT FAQ
-- ============================================
CREATE TABLE IF NOT EXISTS event_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 11. SAVED EVENTS (Bookmarks)
-- ============================================
CREATE TABLE IF NOT EXISTS saved_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================
-- 12. EVENT CERTIFICATES
-- ============================================
CREATE TABLE IF NOT EXISTS event_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pdf_url TEXT, -- Generated certificate PDF
  UNIQUE(event_id, user_id)
);

-- ============================================
-- 13. ATTENDEE NETWORKING CONNECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS event_networking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id, target_user_id)
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON event_ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_schedule_event ON event_schedule(event_id);
CREATE INDEX IF NOT EXISTS idx_schedule_time ON event_schedule(start_time);
CREATE INDEX IF NOT EXISTS idx_speakers_event ON event_speakers(event_id);
CREATE INDEX IF NOT EXISTS idx_reviews_event ON event_reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON event_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON event_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_materials_event ON event_materials(event_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_event ON event_waitlist(event_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_user ON event_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_event ON event_promo_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON event_promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_custom_questions_event ON event_custom_questions(event_id);
CREATE INDEX IF NOT EXISTS idx_faqs_event ON event_faqs(event_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_user ON saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_event ON saved_events(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_event ON event_certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON event_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_networking_event ON event_networking(event_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Ticket Types
ALTER TABLE event_ticket_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ticket types" ON event_ticket_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Organizers can manage ticket types" ON event_ticket_types FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_ticket_types.event_id AND events.organizer_id = auth.uid()));

-- Event Schedule
ALTER TABLE event_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view schedule" ON event_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Organizers can manage schedule" ON event_schedule FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_schedule.event_id AND events.organizer_id = auth.uid()));

-- Speakers
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view speakers" ON event_speakers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Organizers can manage speakers" ON event_speakers FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_speakers.event_id AND events.organizer_id = auth.uid()));

-- Reviews
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON event_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own reviews" ON event_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON event_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON event_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Materials
ALTER TABLE event_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public materials visible to all" ON event_materials FOR SELECT TO authenticated USING (
  is_public = true OR
  EXISTS (SELECT 1 FROM events WHERE events.id = event_materials.event_id AND events.organizer_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM event_rsvps WHERE event_rsvps.event_id = event_materials.event_id AND event_rsvps.user_id = auth.uid())
);
CREATE POLICY "Organizers can manage materials" ON event_materials FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_materials.event_id AND events.organizer_id = auth.uid()));

-- Waitlist
ALTER TABLE event_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own waitlist" ON event_waitlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can join waitlist" ON event_waitlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave waitlist" ON event_waitlist FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Organizers can view event waitlist" ON event_waitlist FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_waitlist.event_id AND events.organizer_id = auth.uid()));

-- Promo Codes
ALTER TABLE event_promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active promo codes" ON event_promo_codes FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Organizers can manage promo codes" ON event_promo_codes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_promo_codes.event_id AND events.organizer_id = auth.uid()));

-- Custom Questions
ALTER TABLE event_custom_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view questions" ON event_custom_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Organizers can manage questions" ON event_custom_questions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_custom_questions.event_id AND events.organizer_id = auth.uid()));

-- Registration Answers
ALTER TABLE event_registration_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own answers" ON event_registration_answers FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM event_rsvps WHERE event_rsvps.id = event_registration_answers.rsvp_id AND event_rsvps.user_id = auth.uid()));
CREATE POLICY "Users can submit answers" ON event_registration_answers FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM event_rsvps WHERE event_rsvps.id = event_registration_answers.rsvp_id AND event_rsvps.user_id = auth.uid()));

-- FAQs
ALTER TABLE event_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view FAQs" ON event_faqs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Organizers can manage FAQs" ON event_faqs FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_faqs.event_id AND events.organizer_id = auth.uid()));

-- Saved Events
ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved events" ON saved_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can save events" ON saved_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave events" ON saved_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Certificates
ALTER TABLE event_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own certificates" ON event_certificates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can issue certificates" ON event_certificates FOR INSERT TO authenticated WITH CHECK (true);

-- Networking
ALTER TABLE event_networking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own connections" ON event_networking FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = target_user_id);
CREATE POLICY "Users can initiate connections" ON event_networking FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON event_networking FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = target_user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Note: Rating trigger will be added later when we add average_rating column to events table
-- For now, we'll calculate ratings on-the-fly in queries

-- Auto-increment waitlist position
CREATE OR REPLACE FUNCTION set_waitlist_position()
RETURNS TRIGGER AS $$
DECLARE
  max_position INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1
  INTO max_position
  FROM event_waitlist
  WHERE event_id = NEW.event_id;

  NEW.position = max_position;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_waitlist_position ON event_waitlist;
CREATE TRIGGER trigger_set_waitlist_position
  BEFORE INSERT ON event_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION set_waitlist_position();
