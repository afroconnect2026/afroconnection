-- Event Promo Codes Table
CREATE TABLE IF NOT EXISTS event_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  max_redemptions INTEGER, -- NULL means unlimited
  current_redemptions INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure code is unique per event
  UNIQUE(event_id, code),
  -- Code should be uppercase alphanumeric
  CONSTRAINT code_format CHECK (code ~ '^[A-Z0-9]+$')
);

-- Promo Code Redemptions Table (track who used which codes)
CREATE TABLE IF NOT EXISTS event_promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES event_promo_codes(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rsvp_id UUID REFERENCES event_rsvps(id) ON DELETE SET NULL,
  discount_applied DECIMAL(10, 2) NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),

  -- One code per user per event
  UNIQUE(event_id, user_id, promo_code_id)
);

-- Indexes
CREATE INDEX idx_promo_codes_event ON event_promo_codes(event_id);
CREATE INDEX idx_promo_codes_code ON event_promo_codes(code);
CREATE INDEX idx_promo_codes_active ON event_promo_codes(is_active);
CREATE INDEX idx_promo_redemptions_code ON event_promo_redemptions(promo_code_id);
CREATE INDEX idx_promo_redemptions_user ON event_promo_redemptions(user_id);

-- RLS Policies for event_promo_codes
ALTER TABLE event_promo_codes ENABLE ROW LEVEL SECURITY;

-- Event organizers can manage promo codes for their events
CREATE POLICY "Organizers can manage promo codes"
  ON event_promo_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
      AND organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
      AND organizer_id = auth.uid()
    )
  );

-- Anyone can view active promo codes for public validation
CREATE POLICY "Anyone can view active promo codes"
  ON event_promo_codes FOR SELECT
  USING (is_active = true);

-- RLS Policies for event_promo_redemptions
ALTER TABLE event_promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY "Users can view own redemptions"
  ON event_promo_redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create redemptions for themselves
CREATE POLICY "Users can create own redemptions"
  ON event_promo_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Organizers can view all redemptions for their events
CREATE POLICY "Organizers can view event redemptions"
  ON event_promo_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
      AND organizer_id = auth.uid()
    )
  );

-- Function to validate and apply promo code
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_event_id UUID,
  p_code TEXT,
  p_user_id UUID
)
RETURNS TABLE(
  valid BOOLEAN,
  message TEXT,
  discount_type TEXT,
  discount_value DECIMAL,
  promo_code_id UUID
) AS $$
DECLARE
  v_promo event_promo_codes%ROWTYPE;
  v_already_used BOOLEAN;
BEGIN
  -- Normalize code to uppercase
  p_code := UPPER(TRIM(p_code));

  -- Check if code exists and is active
  SELECT * INTO v_promo
  FROM event_promo_codes
  WHERE event_id = p_event_id
    AND code = p_code
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid promo code', NULL::TEXT, NULL::DECIMAL, NULL::UUID;
    RETURN;
  END IF;

  -- Check if code has expired
  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < NOW() THEN
    RETURN QUERY SELECT false, 'Promo code has expired', NULL::TEXT, NULL::DECIMAL, NULL::UUID;
    RETURN;
  END IF;

  -- Check if code is not yet valid
  IF v_promo.valid_from > NOW() THEN
    RETURN QUERY SELECT false, 'Promo code is not yet valid', NULL::TEXT, NULL::DECIMAL, NULL::UUID;
    RETURN;
  END IF;

  -- Check if user already used this code
  SELECT EXISTS(
    SELECT 1 FROM event_promo_redemptions
    WHERE promo_code_id = v_promo.id
      AND user_id = p_user_id
  ) INTO v_already_used;

  IF v_already_used THEN
    RETURN QUERY SELECT false, 'You have already used this promo code', NULL::TEXT, NULL::DECIMAL, NULL::UUID;
    RETURN;
  END IF;

  -- Check if redemption limit reached
  IF v_promo.max_redemptions IS NOT NULL
     AND v_promo.current_redemptions >= v_promo.max_redemptions THEN
    RETURN QUERY SELECT false, 'Promo code redemption limit reached', NULL::TEXT, NULL::DECIMAL, NULL::UUID;
    RETURN;
  END IF;

  -- Code is valid
  RETURN QUERY SELECT
    true,
    'Promo code applied successfully',
    v_promo.discount_type,
    v_promo.discount_value,
    v_promo.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment redemption count
CREATE OR REPLACE FUNCTION increment_promo_redemptions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE event_promo_codes
  SET current_redemptions = current_redemptions + 1
  WHERE id = NEW.promo_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_promo_redemptions
  AFTER INSERT ON event_promo_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION increment_promo_redemptions();

-- Updated timestamp triggers
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON event_promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
