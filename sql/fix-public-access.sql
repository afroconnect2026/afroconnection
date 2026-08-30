-- Fix RLS policies to allow public viewing of events and opportunities on landing page

-- DROP OLD POLICIES
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Everyone can view active opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can view their own opportunities" ON opportunities;

-- EVENTS: Allow anonymous (public) users to view published events
CREATE POLICY "Public can view published events"
ON events FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- EVENTS: Authenticated users can also see their own drafts
CREATE POLICY "Users can view own events"
ON events FOR SELECT
TO authenticated
USING (organizer_id = auth.uid());

-- OPPORTUNITIES: Allow anonymous (public) users to view active opportunities
CREATE POLICY "Public can view active opportunities"
ON opportunities FOR SELECT
TO anon, authenticated
USING (status = 'active');

-- OPPORTUNITIES: Authenticated users can also see their own drafts
CREATE POLICY "Users can view own opportunities"
ON opportunities FOR SELECT
TO authenticated
USING (posted_by = auth.uid());

-- Note: This allows the landing page to show published content to visitors
-- while keeping drafts private to their creators
