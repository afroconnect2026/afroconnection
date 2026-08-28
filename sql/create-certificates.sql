-- Event Certificates Table
CREATE TABLE IF NOT EXISTS event_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rsvp_id UUID NOT NULL REFERENCES event_rsvps(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one certificate per user per event
  UNIQUE(event_id, user_id)
);

-- Index for faster lookups
CREATE INDEX idx_certificates_event ON event_certificates(event_id);
CREATE INDEX idx_certificates_user ON event_certificates(user_id);
CREATE INDEX idx_certificates_number ON event_certificates(certificate_number);

-- RLS Policies
ALTER TABLE event_certificates ENABLE ROW LEVEL SECURITY;

-- Anyone can read their own certificates
CREATE POLICY "Users can read own certificates"
  ON event_certificates FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert certificates (via authenticated users who checked in)
CREATE POLICY "Authenticated users can create certificates"
  ON event_certificates FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM event_rsvps
      WHERE id = rsvp_id
      AND user_id = auth.uid()
      AND checked_in = true
    )
  );

-- Event organizers can read all certificates for their events
CREATE POLICY "Organizers can read event certificates"
  ON event_certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
      AND organizer_id = auth.uid()
    )
  );

-- Function to generate unique certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  cert_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Format: CERT-YYYYMMDD-XXXXXX (e.g., CERT-20260828-A1B2C3)
    cert_number := 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                   UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- Check if number already exists
    SELECT EXISTS(SELECT 1 FROM event_certificates WHERE certificate_number = cert_number) INTO exists_check;

    EXIT WHEN NOT exists_check;
  END LOOP;

  RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate certificate number
CREATE OR REPLACE FUNCTION set_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.certificate_number IS NULL OR NEW.certificate_number = '' THEN
    NEW.certificate_number := generate_certificate_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_certificate_number
  BEFORE INSERT ON event_certificates
  FOR EACH ROW
  EXECUTE FUNCTION set_certificate_number();

-- Updated timestamp trigger
CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON event_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
