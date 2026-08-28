-- Event Materials Table
CREATE TABLE IF NOT EXISTS event_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT, -- in bytes
  file_type TEXT NOT NULL, -- 'pdf', 'video', 'image', 'document', 'other'
  material_type TEXT NOT NULL CHECK (material_type IN ('slides', 'recording', 'resource', 'certificate', 'other')),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false, -- if true, anyone can view; if false, only attendees
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_materials_event ON event_materials(event_id);
CREATE INDEX idx_materials_uploader ON event_materials(uploaded_by);
CREATE INDEX idx_materials_type ON event_materials(material_type);

-- RLS Policies
ALTER TABLE event_materials ENABLE ROW LEVEL SECURITY;

-- Event organizers can manage materials for their events
CREATE POLICY "Organizers can manage event materials"
  ON event_materials FOR ALL
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

-- Attendees can view materials for events they RSVP'd to
CREATE POLICY "Attendees can view event materials"
  ON event_materials FOR SELECT
  USING (
    is_public = true OR
    EXISTS (
      SELECT 1 FROM event_rsvps
      WHERE event_id = event_materials.event_id
      AND user_id = auth.uid()
    )
  );

-- Anyone can view public materials
CREATE POLICY "Public materials are viewable by all"
  ON event_materials FOR SELECT
  USING (is_public = true);

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_material_download_count(material_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE event_materials
  SET download_count = download_count + 1
  WHERE id = material_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated timestamp trigger
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON event_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
