-- =====================================================
-- CONNECTION NOTIFICATIONS FIX
-- =====================================================
-- Adds real-time notifications for connection requests
-- User gets notified when:
-- 1. Someone sends them a connection request
-- 2. Their connection request is accepted
-- 3. Their connection request is declined
-- =====================================================

-- =====================================================
-- 1. NOTIFICATION TRIGGER FOR NEW CONNECTION REQUESTS
-- =====================================================

CREATE OR REPLACE FUNCTION notify_connection_request()
RETURNS TRIGGER AS $$
DECLARE
  requester_name TEXT;
BEGIN
  SET search_path = public;
  -- Only notify on new pending requests
  IF NEW.status = 'pending' AND OLD IS NULL THEN
    -- Get requester's name
    SELECT full_name INTO requester_name
    FROM profiles
    WHERE id = NEW.requester_id;

    -- Create notification for addressee using the existing _notify helper
    PERFORM public._notify(
      NEW.addressee_id,
      'connection_request',
      'New Connection Request',
      COALESCE(requester_name, 'Someone') || ' sent you a connection request',
      '/connections',
      jsonb_build_object('connection_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS connection_request_notification ON connections;

-- Create trigger for new connection requests
CREATE TRIGGER connection_request_notification
  AFTER INSERT ON connections
  FOR EACH ROW
  EXECUTE FUNCTION notify_connection_request();

-- =====================================================
-- 2. NOTIFICATION TRIGGER FOR ACCEPTED CONNECTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION notify_connection_status_change()
RETURNS TRIGGER AS $$
DECLARE
  addressee_name TEXT;
BEGIN
  SET search_path = public;
  -- Only notify on status changes from pending
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN

    -- Get addressee's name
    SELECT full_name INTO addressee_name
    FROM profiles
    WHERE id = NEW.addressee_id;

    -- Notify requester when their request is accepted
    IF NEW.status = 'accepted' THEN
      PERFORM public._notify(
        NEW.requester_id,
        'connection_accepted',
        'Connection Accepted! 🎉',
        COALESCE(addressee_name, 'Someone') || ' accepted your connection request',
        '/profile/' || NEW.addressee_id,
        jsonb_build_object('connection_id', NEW.id, 'addressee_id', NEW.addressee_id)
      );
    END IF;

    -- Notify requester when their request is declined
    IF NEW.status = 'declined' THEN
      PERFORM public._notify(
        NEW.requester_id,
        'connection_declined',
        'Connection Request Declined',
        COALESCE(addressee_name, 'Someone') || ' declined your connection request',
        '/connections',
        jsonb_build_object('connection_id', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS connection_status_notification ON connections;

-- Create trigger for connection status changes
CREATE TRIGGER connection_status_notification
  AFTER UPDATE ON connections
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_connection_status_change();

-- =====================================================
-- 3. ADD NEW NOTIFICATION TYPES TO ENUM (IF NEEDED)
-- =====================================================

-- Check if notification types need to be added
-- These should already exist in your notifications table
-- If not, run these:

-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'connection_request';
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'connection_accepted';
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'connection_declined';

-- =====================================================
-- 4. TEST THE TRIGGERS
-- =====================================================

-- To test after running this SQL:
-- 1. Send a connection request → Addressee should get notification
-- 2. Accept the request → Requester should get notification
-- 3. Send another request and decline → Requester should get notification

-- Check notifications with:
-- SELECT * FROM notifications WHERE type LIKE 'connection%' ORDER BY created_at DESC LIMIT 10;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify triggers were created:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'connections'
-- ORDER BY trigger_name;

COMMENT ON FUNCTION notify_connection_request() IS 'Creates notification when someone sends a connection request';
COMMENT ON FUNCTION notify_connection_status_change() IS 'Creates notification when connection request is accepted or declined';
