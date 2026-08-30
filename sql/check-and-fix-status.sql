-- Check current status of events and opportunities
SELECT 'EVENTS' as table_name, id, title, status FROM events;
SELECT 'OPPORTUNITIES' as table_name, id, title, status FROM opportunities;

-- If they're not published/active, run these to fix:

-- Update all events to published status
UPDATE events SET status = 'published' WHERE status IS NULL OR status != 'published';

-- Update all opportunities to active status
UPDATE opportunities SET status = 'active' WHERE status IS NULL OR status != 'active';

-- Verify the updates
SELECT 'UPDATED EVENTS' as info, id, title, status FROM events;
SELECT 'UPDATED OPPORTUNITIES' as info, id, title, status FROM opportunities;
