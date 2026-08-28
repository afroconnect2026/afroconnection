-- Email Reminder Settings Table
CREATE TABLE IF NOT EXISTS event_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('one_week', 'one_day', 'one_hour')),
  is_enabled BOOLEAN DEFAULT true,
  email_subject TEXT NOT NULL,
  email_template TEXT, -- Custom template (optional)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One setting per type per event
  UNIQUE(event_id, reminder_type)
);

-- Email Reminder Logs Table (track what was sent)
CREATE TABLE IF NOT EXISTS event_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  email_to TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,

  -- Prevent duplicate sends
  UNIQUE(event_id, user_id, reminder_type)
);

-- Indexes
CREATE INDEX idx_reminder_settings_event ON event_reminder_settings(event_id);
CREATE INDEX idx_reminder_logs_event ON event_reminder_logs(event_id);
CREATE INDEX idx_reminder_logs_user ON event_reminder_logs(user_id);
CREATE INDEX idx_reminder_logs_status ON event_reminder_logs(status);

-- RLS Policies for event_reminder_settings
ALTER TABLE event_reminder_settings ENABLE ROW LEVEL SECURITY;

-- Event organizers can manage reminder settings
CREATE POLICY "Organizers can manage reminder settings"
  ON event_reminder_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
      AND organizer_id = auth.uid()
    )
  );

-- RLS Policies for event_reminder_logs
ALTER TABLE event_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own reminder logs
CREATE POLICY "Users can view own reminder logs"
  ON event_reminder_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Organizers can view all logs for their events
CREATE POLICY "Organizers can view event reminder logs"
  ON event_reminder_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
      AND organizer_id = auth.uid()
    )
  );

-- System can insert logs (for email service)
CREATE POLICY "System can insert reminder logs"
  ON event_reminder_logs FOR INSERT
  WITH CHECK (true);

-- Function to get users who need reminders
CREATE OR REPLACE FUNCTION get_users_needing_reminders(
  reminder_interval INTERVAL
)
RETURNS TABLE(
  event_id UUID,
  event_title TEXT,
  event_start_date TIMESTAMPTZ,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  reminder_type TEXT,
  reminder_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id as event_id,
    e.title as event_title,
    e.start_date as event_start_date,
    r.user_id,
    p.email as user_email,
    p.full_name as user_name,
    CASE
      WHEN reminder_interval = INTERVAL '7 days' THEN 'one_week'
      WHEN reminder_interval = INTERVAL '1 day' THEN 'one_day'
      WHEN reminder_interval = INTERVAL '1 hour' THEN 'one_hour'
    END as reminder_type,
    COALESCE(s.is_enabled, false) as reminder_enabled
  FROM events e
  INNER JOIN event_rsvps r ON e.id = r.event_id
  INNER JOIN profiles p ON r.user_id = p.id
  LEFT JOIN event_reminder_settings s ON e.id = s.event_id
    AND s.reminder_type = CASE
      WHEN reminder_interval = INTERVAL '7 days' THEN 'one_week'
      WHEN reminder_interval = INTERVAL '1 day' THEN 'one_day'
      WHEN reminder_interval = INTERVAL '1 hour' THEN 'one_hour'
    END
  WHERE
    -- Event is upcoming
    e.start_date > NOW()
    -- Event starts in approximately the reminder interval
    AND e.start_date <= NOW() + reminder_interval + INTERVAL '30 minutes'
    AND e.start_date >= NOW() + reminder_interval - INTERVAL '30 minutes'
    -- User RSVP'd as going
    AND r.status = 'going'
    -- Reminder not already sent
    AND NOT EXISTS (
      SELECT 1 FROM event_reminder_logs l
      WHERE l.event_id = e.id
        AND l.user_id = r.user_id
        AND l.reminder_type = CASE
          WHEN reminder_interval = INTERVAL '7 days' THEN 'one_week'
          WHEN reminder_interval = INTERVAL '1 day' THEN 'one_day'
          WHEN reminder_interval = INTERVAL '1 hour' THEN 'one_hour'
        END
        AND l.status = 'sent'
    )
    -- Reminder is enabled (or no settings means default enabled)
    AND COALESCE(s.is_enabled, true) = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated timestamp trigger
CREATE TRIGGER update_reminder_settings_updated_at
  BEFORE UPDATE ON event_reminder_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
