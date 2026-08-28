-- Events & Networking System for AfroConnect
-- Run this in Supabase SQL Editor

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'conference', 'meetup', 'webinar', 'workshop', 'networking'
  format TEXT NOT NULL, -- 'in-person', 'virtual', 'hybrid'
  category TEXT, -- 'tech', 'business', 'networking', 'social', etc.

  -- Location
  location TEXT,
  venue_name TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  virtual_link TEXT, -- Zoom, Google Meet, etc.

  -- Date & Time
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'UTC',

  -- Capacity & Pricing
  max_attendees INTEGER,
  is_free BOOLEAN DEFAULT true,
  ticket_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',

  -- Media
  cover_image_url TEXT,
  thumbnail_url TEXT,

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'published', 'cancelled', 'completed'
  is_featured BOOLEAN DEFAULT false,

  -- Stats
  views_count INTEGER DEFAULT 0,
  rsvp_count INTEGER DEFAULT 0,

  -- Metadata
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event RSVPs table
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going', -- 'going', 'interested', 'not_going'
  ticket_id TEXT, -- For paid events
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create event attendees (for organizers to see who's coming)
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rsvp_id UUID REFERENCES event_rsvps(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT false,
  feedback_rating INTEGER, -- 1-5 stars
  feedback_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_format ON events(format);
CREATE INDEX IF NOT EXISTS idx_events_city_country ON events(city, country);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON event_rsvps(status);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Anyone can view published events"
ON events FOR SELECT
TO authenticated
USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "Users can create events"
ON events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update own events"
ON events FOR UPDATE
TO authenticated
USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete own events"
ON events FOR DELETE
TO authenticated
USING (auth.uid() = organizer_id);

-- RLS Policies for RSVPs
CREATE POLICY "Users can view RSVPs"
ON event_rsvps FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create own RSVPs"
ON event_rsvps FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RSVPs"
ON event_rsvps FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVPs"
ON event_rsvps FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for attendees
CREATE POLICY "Event organizers can view attendees"
ON event_attendees FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_attendees.event_id
    AND events.organizer_id = auth.uid()
  )
);

CREATE POLICY "System can insert attendees"
ON event_attendees FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

DROP TRIGGER IF EXISTS event_rsvps_updated_at ON event_rsvps;
CREATE TRIGGER event_rsvps_updated_at
  BEFORE UPDATE ON event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Trigger: Notify organizer when someone RSVPs
CREATE OR REPLACE FUNCTION notify_event_rsvp()
RETURNS TRIGGER AS $$
DECLARE
  v_event_title TEXT;
  v_user_name TEXT;
  v_organizer_id UUID;
BEGIN
  -- Only notify for new RSVPs with 'going' status
  IF NEW.status = 'going' THEN
    -- Get event details
    SELECT title, organizer_id
    INTO v_event_title, v_organizer_id
    FROM events
    WHERE id = NEW.event_id;

    -- Get user name
    SELECT full_name
    INTO v_user_name
    FROM profiles
    WHERE id = NEW.user_id;

    -- Don't notify if organizer RSVPs to their own event
    IF v_organizer_id != NEW.user_id THEN
      -- Create notification
      PERFORM create_notification(
        v_organizer_id,
        'event',
        'New Event RSVP',
        v_user_name || ' is attending your event: ' || v_event_title,
        '/events/' || NEW.event_id || '/attendees',
        jsonb_build_object('rsvp_id', NEW.id, 'user_id', NEW.user_id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_event_rsvp ON event_rsvps;
CREATE TRIGGER trigger_notify_event_rsvp
  AFTER INSERT ON event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_rsvp();

-- Trigger: Update RSVP count
CREATE OR REPLACE FUNCTION update_event_rsvp_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'going' THEN
    UPDATE events
    SET rsvp_count = rsvp_count + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'going' AND OLD.status != 'going' THEN
      UPDATE events
      SET rsvp_count = rsvp_count + 1
      WHERE id = NEW.event_id;
    ELSIF OLD.status = 'going' AND NEW.status != 'going' THEN
      UPDATE events
      SET rsvp_count = GREATEST(0, rsvp_count - 1)
      WHERE id = NEW.event_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'going' THEN
    UPDATE events
    SET rsvp_count = GREATEST(0, rsvp_count - 1)
    WHERE id = OLD.event_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_rsvp_count ON event_rsvps;
CREATE TRIGGER trigger_update_event_rsvp_count
  AFTER INSERT OR UPDATE OR DELETE ON event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_event_rsvp_count();
