-- =====================================================================
-- AFROCONNECT - VERIFICATION + ADMIN NOTIFICATIONS FIX
-- Run AFTER sql/PRODUCTION-ADMIN-FIX.sql, in the Supabase SQL Editor.
-- Safe to re-run (idempotent).
--
-- Adds:
--  * Verification document uploads (private storage bucket + policies)
--  * "Request more info" with a structured list of requested documents
--  * Resubmission tracking (submission_count / resubmitted_at)
--  * Admin notifications for: new/resubmitted verification requests,
--    new pending opportunities, new pending events, new reports
--  * admin_pending_counts() for the admin notification bell / nav badges
--  * Realtime delivery of notifications (supabase_realtime publication)
--  * Auto-approve settings (admin Settings page) actually enforced
--  * get_public_settings() so maintenance mode / registration toggles work
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. SCHEMA
-- ---------------------------------------------------------------------
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS requested_documents TEXT[];
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS submission_count INT DEFAULT 1;
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS resubmitted_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------
-- 1. STORAGE: private bucket for verification documents
--    Path convention: <user_id>/<timestamp>-<filename>
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents', 'verification-documents', false, 10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS vdocs_owner_insert ON storage.objects;
CREATE POLICY vdocs_owner_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-documents'
              AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS vdocs_owner_or_admin_select ON storage.objects;
CREATE POLICY vdocs_owner_or_admin_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-documents'
         AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

DROP POLICY IF EXISTS vdocs_owner_delete ON storage.objects;
CREATE POLICY vdocs_owner_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'verification-documents'
         AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(ARRAY['super_admin'])));

-- ---------------------------------------------------------------------
-- 2. HELPER: notify every active admin with one of the given roles
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._notify_admins(
  p_roles TEXT[], p_type TEXT, p_title TEXT, p_message TEXT, p_link TEXT, p_data JSONB,
  p_exclude UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM admin_users
    WHERE is_active AND role = ANY (p_roles) AND id IS DISTINCT FROM p_exclude
  LOOP
    -- _notify silently skips admins that have no profile row
    PERFORM public._notify(r.id, p_type, p_title, p_message, p_link, p_data);
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public._notify_admins(TEXT[], TEXT, TEXT, TEXT, TEXT, JSONB, UUID) FROM PUBLIC;

-- ---------------------------------------------------------------------
-- 3. USER RPC: submit / update / resubmit a verification request
--    (replaces the 4-argument version)
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_verification_request(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.submit_verification_request(
  p_linkedin_url TEXT,
  p_company_registration TEXT,
  p_website_url TEXT,
  p_notes TEXT,
  p_documents JSONB DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_existing verification_requests%ROWTYPE;
  v_id UUID;
  v_name TEXT;
  v_docs JSONB;
  v_was_status TEXT := NULL;
  v_doc JSONB;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'You must be signed in'; END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_uid) THEN
    RAISE EXCEPTION 'Please complete your profile before requesting verification';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_uid AND is_verified) THEN
    RAISE EXCEPTION 'Your account is already verified';
  END IF;

  -- Only accept documents stored in the caller's own folder
  IF p_documents IS NOT NULL THEN
    IF jsonb_typeof(p_documents) <> 'array' THEN
      RAISE EXCEPTION 'Invalid documents payload';
    END IF;
    FOR v_doc IN SELECT * FROM jsonb_array_elements(p_documents) LOOP
      IF COALESCE(v_doc->>'path', '') NOT LIKE v_uid::text || '/%' THEN
        RAISE EXCEPTION 'Invalid document path';
      END IF;
    END LOOP;
  END IF;

  SELECT * INTO v_existing FROM verification_requests
  WHERE user_id = v_uid ORDER BY created_at DESC LIMIT 1;

  IF FOUND AND v_existing.status IN ('pending', 'rejected', 'info_needed') THEN
    v_was_status := v_existing.status;
    v_docs := COALESCE(p_documents, v_existing.documents);
  ELSE
    v_docs := p_documents;
  END IF;

  IF COALESCE(NULLIF(trim(p_linkedin_url), ''), NULLIF(trim(p_company_registration), ''),
              NULLIF(trim(p_website_url), '')) IS NULL
     AND COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_docs) = 'array' THEN v_docs END), 0) = 0 THEN
    RAISE EXCEPTION 'Please provide at least one verification document';
  END IF;

  IF v_was_status IS NOT NULL THEN
    UPDATE verification_requests SET
      linkedin_url = NULLIF(trim(p_linkedin_url), ''),
      company_registration = NULLIF(trim(p_company_registration), ''),
      website_url = NULLIF(trim(p_website_url), ''),
      notes = NULLIF(trim(p_notes), ''),
      documents = v_docs,
      status = 'pending',
      rejection_reason = CASE WHEN v_was_status = 'pending' THEN rejection_reason ELSE NULL END,
      reviewed_by = CASE WHEN v_was_status = 'pending' THEN reviewed_by ELSE NULL END,
      reviewed_at = CASE WHEN v_was_status = 'pending' THEN reviewed_at ELSE NULL END,
      submission_count = CASE WHEN v_was_status = 'pending' THEN COALESCE(submission_count, 1)
                              ELSE COALESCE(submission_count, 1) + 1 END,
      resubmitted_at = CASE WHEN v_was_status = 'pending' THEN resubmitted_at ELSE NOW() END,
      updated_at = NOW()
    WHERE id = v_existing.id
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO verification_requests
      (user_id, status, linkedin_url, company_registration, website_url, notes, documents, submission_count)
    VALUES (v_uid, 'pending', NULLIF(trim(p_linkedin_url), ''), NULLIF(trim(p_company_registration), ''),
            NULLIF(trim(p_website_url), ''), NULLIF(trim(p_notes), ''), v_docs, 1)
    RETURNING id INTO v_id;
  END IF;

  -- Notify moderators for new requests and resubmissions (not for edits of a pending request)
  IF v_was_status IS DISTINCT FROM 'pending' THEN
    SELECT full_name INTO v_name FROM profiles WHERE id = v_uid;
    PERFORM public._notify_admins(ARRAY['super_admin', 'moderator'], 'admin_verification',
      CASE WHEN v_was_status IS NULL THEN 'New verification request' ELSE 'Verification request resubmitted' END,
      COALESCE(v_name, 'A user') ||
        CASE WHEN v_was_status = 'info_needed' THEN ' sent the additional information you requested'
             WHEN v_was_status = 'rejected' THEN ' resubmitted their verification request'
             ELSE ' requested account verification' END,
      '/admin/verifications',
      jsonb_build_object('request_id', v_id, 'user_id', v_uid), v_uid);
  END IF;

  RETURN json_build_object('id', v_id, 'status', 'pending');
END;
$$;
REVOKE ALL ON FUNCTION public.submit_verification_request(TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_verification_request(TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- ---------------------------------------------------------------------
-- 4. ADMIN RPC: review a verification request
--    (replaces the 3-argument version; adds requested documents list)
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_review_verification(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.admin_review_verification(
  p_request_id UUID, p_decision TEXT, p_reason TEXT DEFAULT NULL, p_requested_documents TEXT[] DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_docs TEXT[] := NULLIF(p_requested_documents, ARRAY[]::TEXT[]);
  v_list TEXT;
BEGIN
  PERFORM public._require_admin(ARRAY['super_admin', 'moderator']);
  IF p_decision NOT IN ('approved', 'rejected', 'info_needed') THEN
    RAISE EXCEPTION 'Invalid decision: %', p_decision;
  END IF;
  IF p_decision = 'rejected' AND COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'A rejection reason is required';
  END IF;
  IF p_decision = 'info_needed' AND COALESCE(trim(p_reason), '') = '' AND v_docs IS NULL THEN
    RAISE EXCEPTION 'Tell the user what information or documents you need';
  END IF;

  v_list := array_to_string(v_docs, ', ');

  UPDATE verification_requests SET
    status = p_decision,
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    rejection_reason = CASE WHEN p_decision = 'approved' THEN NULL
                            ELSE COALESCE(NULLIF(trim(p_reason), ''), 'Please provide: ' || v_list) END,
    requested_documents = CASE WHEN p_decision = 'info_needed' THEN v_docs ELSE NULL END,
    admin_notes = COALESCE(NULLIF(trim(p_reason), ''), admin_notes),
    updated_at = NOW()
  WHERE id = p_request_id
  RETURNING user_id INTO v_user;

  IF v_user IS NULL THEN RAISE EXCEPTION 'Verification request not found'; END IF;

  IF p_decision = 'approved' THEN
    UPDATE profiles SET is_verified = true, verified_at = NOW(), verified_by = auth.uid()
    WHERE id = v_user;
    PERFORM public._notify(v_user, 'verification', 'You are verified!',
      'Your account has been verified. Your verified badge is now visible on your profile.' ||
        COALESCE(' Note from our team: ' || NULLIF(trim(p_reason), ''), ''),
      '/profile/' || v_user, jsonb_build_object('request_id', p_request_id, 'status', 'approved'));
    PERFORM public._log_admin('verify_user', 'user', v_user, jsonb_build_object('verification_request_id', p_request_id));
  ELSIF p_decision = 'rejected' THEN
    PERFORM public._notify(v_user, 'verification', 'Verification request not approved',
      'Reason: ' || trim(p_reason) || '. You can update your details and resubmit.',
      '/settings/verification', jsonb_build_object('request_id', p_request_id, 'status', 'rejected'));
    PERFORM public._log_admin('reject_verification', 'user', v_user, jsonb_build_object('verification_request_id', p_request_id, 'reason', p_reason));
  ELSE
    PERFORM public._notify(v_user, 'verification', 'More information needed for verification',
      COALESCE(NULLIF(trim(p_reason), ''), 'Our team needs more information to verify your account.') ||
        COALESCE(' Requested: ' || v_list || '.', '') ||
        ' Open Settings > Verification to upload and resubmit.',
      '/settings/verification',
      jsonb_build_object('request_id', p_request_id, 'status', 'info_needed', 'requested_documents', to_jsonb(v_docs)));
    PERFORM public._log_admin('request_verification_info', 'user', v_user,
      jsonb_build_object('verification_request_id', p_request_id, 'reason', p_reason, 'requested_documents', to_jsonb(v_docs)));
  END IF;

  RETURN json_build_object('request_id', p_request_id, 'user_id', v_user, 'status', p_decision);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_review_verification(UUID, TEXT, TEXT, TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_verification(UUID, TEXT, TEXT, TEXT[]) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. ADMIN RPC: pending counts (bell + nav badges)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_pending_counts()
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin();
  RETURN json_build_object(
    'verifications',      (SELECT COUNT(*) FROM verification_requests WHERE status = 'pending'),
    'verifications_info', (SELECT COUNT(*) FROM verification_requests WHERE status = 'info_needed'),
    'opportunities',      (SELECT COUNT(*) FROM opportunities WHERE moderation_status = 'pending'),
    'events',             (SELECT COUNT(*) FROM events WHERE moderation_status = 'pending'),
    'reports',            (SELECT COUNT(*) FROM content_reports WHERE status IN ('pending', 'reviewing'))
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_pending_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_pending_counts() TO authenticated;

-- ---------------------------------------------------------------------
-- 6. AUTO-APPROVE SETTINGS + MODERATION TRIGGER
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._setting_bool(p_key TEXT, p_default BOOLEAN)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT CASE WHEN jsonb_typeof(value -> p_key) = 'boolean' THEN (value ->> p_key)::boolean END
     FROM system_settings WHERE key = 'platform'),
    p_default);
$$;
REVOKE ALL ON FUNCTION public._setting_bool(TEXT, BOOLEAN) FROM PUBLIC;

-- Columns that change without the owner editing the content
CREATE OR REPLACE FUNCTION public._counter_columns()
RETURNS TEXT[] LANGUAGE sql IMMUTABLE
AS $$
  SELECT ARRAY['views_count', 'applications_count', 'rsvp_count', 'saves_count', 'attendees_count',
               'current_attendees', 'updated_at', 'moderation_status', 'moderated_by', 'moderated_at',
               'moderation_notes']::TEXT[];
$$;

-- View counter usable by any signed-in viewer (RLS blocks direct UPDATEs by non-owners)
CREATE OR REPLACE FUNCTION public.increment_content_views(p_content_type TEXT, p_content_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_content_type = 'opportunity' THEN
    UPDATE opportunities SET views_count = COALESCE(views_count, 0) + 1 WHERE id = p_content_id;
  ELSIF p_content_type = 'event' THEN
    UPDATE events SET views_count = COALESCE(views_count, 0) + 1 WHERE id = p_content_id;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.increment_content_views(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_content_views(TEXT, UUID) TO authenticated;

-- applications_count maintained server-side (applicants cannot UPDATE the opportunity row)
CREATE OR REPLACE FUNCTION public.sync_opportunity_applications_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID := COALESCE(NEW.opportunity_id, OLD.opportunity_id);
BEGIN
  UPDATE opportunities
  SET applications_count = (SELECT COUNT(*) FROM opportunity_applications WHERE opportunity_id = v_id)
  WHERE id = v_id;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trg_sync_opp_applications_count ON opportunity_applications;
CREATE TRIGGER trg_sync_opp_applications_count
  AFTER INSERT OR DELETE ON opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_opportunity_applications_count();

-- Owner write policies (re-asserted; additive to any existing ones)
DROP POLICY IF EXISTS opp_owner_insert ON opportunities;
CREATE POLICY opp_owner_insert ON opportunities FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
DROP POLICY IF EXISTS opp_owner_update ON opportunities;
CREATE POLICY opp_owner_update ON opportunities FOR UPDATE TO authenticated
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
DROP POLICY IF EXISTS opp_owner_delete ON opportunities;
CREATE POLICY opp_owner_delete ON opportunities FOR DELETE TO authenticated USING (creator_id = auth.uid());

DROP POLICY IF EXISTS events_owner_insert ON events;
CREATE POLICY events_owner_insert ON events FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid());
DROP POLICY IF EXISTS events_owner_update ON events;
CREATE POLICY events_owner_update ON events FOR UPDATE TO authenticated
  USING (organizer_id = auth.uid()) WITH CHECK (organizer_id = auth.uid());
DROP POLICY IF EXISTS events_owner_delete ON events;
CREATE POLICY events_owner_delete ON events FOR DELETE TO authenticated USING (organizer_id = auth.uid());

-- Organizers can check attendees in (update RSVPs for their own events)
DROP POLICY IF EXISTS rsvps_organizer_update ON event_rsvps;
CREATE POLICY rsvps_organizer_update ON event_rsvps FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM events e WHERE e.id = event_rsvps.event_id AND e.organizer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM events e WHERE e.id = event_rsvps.event_id AND e.organizer_id = auth.uid()));

-- RSVP counter trigger must bypass RLS (attendees cannot UPDATE the event row)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_event_rsvp_count' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.update_event_rsvp_count() SECURITY DEFINER;
    ALTER FUNCTION public.update_event_rsvp_count() SET search_path = public;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_content_moderation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.moderation_status := CASE
      WHEN TG_TABLE_NAME = 'opportunities' AND public._setting_bool('autoApproveOpportunities', false) THEN 'approved'
      WHEN TG_TABLE_NAME = 'events' AND public._setting_bool('autoApproveEvents', false) THEN 'approved'
      ELSE 'pending' END;
    NEW.moderated_by := NULL;
    NEW.moderated_at := NULL;
    NEW.moderation_notes := NULL;
  ELSE
    NEW.moderated_by := OLD.moderated_by;
    NEW.moderated_at := OLD.moderated_at;
    NEW.moderation_notes := OLD.moderation_notes;
    -- an EDITED rejected item goes back into the review queue
    -- (counter-only updates such as views/RSVP counts must not resubmit it)
    IF OLD.moderation_status = 'rejected'
       AND (to_jsonb(NEW) - public._counter_columns()) IS DISTINCT FROM (to_jsonb(OLD) - public._counter_columns()) THEN
      NEW.moderation_status := 'pending';
    ELSE
      NEW.moderation_status := OLD.moderation_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- 7. ADMIN NOTIFICATION TRIGGERS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_admins_pending_content()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row JSONB := to_jsonb(NEW);
  v_label TEXT := CASE WHEN TG_TABLE_NAME = 'opportunities' THEN 'opportunity' ELSE 'event' END;
  v_owner UUID := NULLIF(COALESCE(v_row->>'creator_id', v_row->>'organizer_id'), '')::uuid;
  v_name TEXT;
  v_resubmitted BOOLEAN := (TG_OP = 'UPDATE');
BEGIN
  IF NEW.moderation_status IS DISTINCT FROM 'pending' THEN RETURN NULL; END IF;
  IF TG_OP = 'UPDATE' AND OLD.moderation_status IS NOT DISTINCT FROM 'pending' THEN RETURN NULL; END IF;
  -- an admin moving content back to pending does not need an alert
  IF auth.uid() IS NOT NULL AND public.is_admin() THEN RETURN NULL; END IF;

  SELECT full_name INTO v_name FROM profiles WHERE id = v_owner;
  PERFORM public._notify_admins(ARRAY['super_admin', 'moderator'], 'admin_' || v_label,
    CASE WHEN v_resubmitted THEN initcap(v_label) || ' resubmitted for review'
         ELSE 'New ' || v_label || ' pending review' END,
    COALESCE(v_name, 'A user') || CASE WHEN v_resubmitted THEN ' edited "' ELSE ' posted "' END ||
      COALESCE(NEW.title, 'Untitled') || '"',
    CASE WHEN TG_TABLE_NAME = 'opportunities' THEN '/admin/opportunities' ELSE '/admin/events' END,
    jsonb_build_object('content_id', NEW.id, 'content_type', v_label), v_owner);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_opp ON opportunities;
CREATE TRIGGER trg_notify_admins_opp
  AFTER INSERT OR UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_pending_content();

DROP TRIGGER IF EXISTS trg_notify_admins_event ON events;
CREATE TRIGGER trg_notify_admins_event
  AFTER INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_pending_content();

CREATE OR REPLACE FUNCTION public.notify_admins_new_report()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public._notify_admins(ARRAY['super_admin', 'moderator', 'support'], 'admin_report',
    'New report: ' || replace(COALESCE(NEW.report_type, 'content'), '_', ' '),
    'A ' || COALESCE(NEW.reported_content_type, 'user') || ' was reported' ||
      COALESCE(' (' || NEW.severity || ' severity)', ''),
    '/admin/reports', jsonb_build_object('report_id', NEW.id), NEW.reporter_id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_report ON content_reports;
CREATE TRIGGER trg_notify_admins_report
  AFTER INSERT ON content_reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_report();

-- ---------------------------------------------------------------------
-- 8. PUBLIC SETTINGS (maintenance mode / registration toggle)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_settings()
RETURNS JSON LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT json_build_object(
    'maintenanceMode', public._setting_bool('maintenanceMode', false),
    'userRegistration', public._setting_bool('userRegistration', true)
  );
$$;
REVOKE ALL ON FUNCTION public.get_public_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_settings() TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 9. REALTIME: deliver notification inserts to the bell instantly
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
                     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- Users can only mark / delete their own notifications (re-assert)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- 10. SANITY CHECKS
-- ---------------------------------------------------------------------
SELECT 'admins_without_profile (get no bell notifications)' AS item,
       COUNT(*)::text AS value
FROM admin_users a WHERE a.is_active AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = a.id)
UNION ALL SELECT 'pending_verifications', COUNT(*)::text FROM verification_requests WHERE status = 'pending'
UNION ALL SELECT 'info_needed_verifications', COUNT(*)::text FROM verification_requests WHERE status = 'info_needed'
UNION ALL SELECT 'notifications_in_realtime',
  (SELECT COUNT(*)::text FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications');
