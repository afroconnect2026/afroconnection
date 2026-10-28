-- =====================================================================
-- AFROCONNECT - PRODUCTION ADMIN / MODERATION / VERIFICATION FIX
-- Run this ONCE in Supabase SQL Editor (safe to re-run: idempotent).
-- NOTE: if you re-run this file, re-run sql/VERIFICATION-NOTIFICATIONS-FIX.sql afterwards
-- (it replaces submit_verification_request / admin_review_verification with newer versions).
--
-- Fixes:
--  * Admin approve/reject silently doing nothing (RLS only allowed owners
--    to update opportunities/events/profiles; client ignored errors)
--  * Verification submissions failing (form wrote non-existent columns)
--  * Recursive / fragile admin_users RLS checks -> replaced by is_admin()
--  * Pending (unmoderated) content visible publicly
--  * Users able to self-verify or self-approve their own content
--  * Staff creation failing (password_hash NOT NULL, no insert policy)
--  * Admin reads of profiles blocked by PII column grants (email)
--  * Notifications to users on approval / rejection
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. SCHEMA ADJUSTMENTS
-- ---------------------------------------------------------------------
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE admin_users ALTER COLUMN password_hash DROP NOT NULL;

-- ---------------------------------------------------------------------
-- 1. ADMIN HELPER (SECURITY DEFINER -> no RLS recursion)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(p_roles TEXT[] DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
      AND is_active = true
      AND (p_roles IS NULL OR role = ANY (p_roles))
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(TEXT[]) TO authenticated, anon;

-- Internal helper: raise unless caller has one of the roles
CREATE OR REPLACE FUNCTION public._require_admin(p_roles TEXT[] DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(p_roles) THEN
    RAISE EXCEPTION 'Not authorized: your admin role cannot perform this action'
      USING ERRCODE = '42501';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public._require_admin(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._require_admin(TEXT[]) TO authenticated;

-- Internal helper: log admin action
CREATE OR REPLACE FUNCTION public._log_admin(p_action TEXT, p_target_type TEXT, p_target_id UUID, p_details JSONB)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details);
$$;
REVOKE ALL ON FUNCTION public._log_admin(TEXT, TEXT, UUID, JSONB) FROM PUBLIC;

-- Internal helper: notify a user (only if they have a profile)
CREATE OR REPLACE FUNCTION public._notify(p_user_id UUID, p_type TEXT, p_title TEXT, p_message TEXT, p_link TEXT, p_data JSONB)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RETURN;
  END IF;
  INSERT INTO notifications (user_id, type, title, message, link, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_data);
END;
$$;
REVOKE ALL ON FUNCTION public._notify(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;

-- ---------------------------------------------------------------------
-- 2. RLS POLICIES
-- ---------------------------------------------------------------------
-- Drop every existing policy on the admin-owned tables and rebuild cleanly
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('admin_users','admin_activity_log','verification_requests',
                        'content_reports','user_bans','system_settings')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

ALTER TABLE admin_users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings       ENABLE ROW LEVEL SECURITY;

-- admin_users: a user can read their own row (for login check); admins read all;
-- only super_admin can write (writes go through RPCs below anyway)
CREATE POLICY admin_users_select ON admin_users FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY admin_users_super_admin_write ON admin_users FOR ALL TO authenticated
  USING (public.is_admin(ARRAY['super_admin'])) WITH CHECK (public.is_admin(ARRAY['super_admin']));

-- admin_activity_log
CREATE POLICY admin_log_select ON admin_activity_log FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY admin_log_insert ON admin_activity_log FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- verification_requests
CREATE POLICY vr_user_select ON verification_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY vr_user_insert ON verification_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY vr_admin_all ON verification_requests FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- content_reports
CREATE POLICY reports_user_insert ON content_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY reports_user_select ON content_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());
CREATE POLICY reports_admin_all ON content_reports FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- user_bans: user can see own bans (used to block banned users); admins manage
CREATE POLICY bans_user_select ON user_bans FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY bans_admin_all ON user_bans FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- system_settings: admins read, super_admin writes
CREATE POLICY settings_admin_select ON system_settings FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY settings_super_admin_write ON system_settings FOR ALL TO authenticated
  USING (public.is_admin(ARRAY['super_admin'])) WITH CHECK (public.is_admin(ARRAY['super_admin']));

-- profiles: admins may update any profile (in addition to existing own-profile policies)
DROP POLICY IF EXISTS admins_update_profiles ON profiles;
CREATE POLICY admins_update_profiles ON profiles FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- opportunities: rebuild SELECT policies so only APPROVED content is public
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename IN ('opportunities') AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.opportunities', r.policyname);
  END LOOP;
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename IN ('events') AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.events', r.policyname);
  END LOOP;
END $$;

CREATE POLICY opp_public_select ON opportunities FOR SELECT TO anon, authenticated
  USING (status = 'active' AND COALESCE(moderation_status, 'approved') = 'approved');
CREATE POLICY opp_owner_select ON opportunities FOR SELECT TO authenticated
  USING (creator_id = auth.uid());
CREATE POLICY opp_admin_select ON opportunities FOR SELECT TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS opp_admin_all ON opportunities;
CREATE POLICY opp_admin_all ON opportunities FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY events_public_select ON events FOR SELECT TO anon, authenticated
  USING (status = 'published' AND COALESCE(moderation_status, 'approved') = 'approved');
CREATE POLICY events_owner_select ON events FOR SELECT TO authenticated
  USING (organizer_id = auth.uid());
CREATE POLICY events_admin_select ON events FOR SELECT TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS events_admin_all ON events;
CREATE POLICY events_admin_all ON events FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 3. INTEGRITY TRIGGERS (users cannot self-verify / self-approve)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_verification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- service role / SQL editor (no JWT) and admins are allowed
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_verified := false;
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
  ELSE
    NEW.is_verified := OLD.is_verified;
    NEW.verified_at := OLD.verified_at;
    NEW.verified_by := OLD.verified_by;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_protect_profile_verification ON profiles;
CREATE TRIGGER trg_protect_profile_verification
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_verification();

CREATE OR REPLACE FUNCTION public.enforce_content_moderation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.moderation_status := 'pending';
    NEW.moderated_by := NULL;
    NEW.moderated_at := NULL;
    NEW.moderation_notes := NULL;
  ELSE
    NEW.moderated_by := OLD.moderated_by;
    NEW.moderated_at := OLD.moderated_at;
    NEW.moderation_notes := OLD.moderation_notes;
    -- an edited rejected item goes back into the review queue
    IF OLD.moderation_status = 'rejected' AND auth.uid() IS NOT NULL THEN
      NEW.moderation_status := 'pending';
    ELSE
      NEW.moderation_status := OLD.moderation_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_enforce_opp_moderation ON opportunities;
CREATE TRIGGER trg_enforce_opp_moderation
  BEFORE INSERT OR UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION public.enforce_content_moderation();
DROP TRIGGER IF EXISTS trg_enforce_event_moderation ON events;
CREATE TRIGGER trg_enforce_event_moderation
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_content_moderation();

-- ---------------------------------------------------------------------
-- 4. USER-SIDE RPC: submit verification request
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_verification_request(
  p_linkedin_url TEXT,
  p_company_registration TEXT,
  p_website_url TEXT,
  p_notes TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_existing verification_requests%ROWTYPE;
  v_id UUID;
  v_name TEXT;
  r RECORD;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'You must be signed in'; END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_uid) THEN
    RAISE EXCEPTION 'Please complete your profile before requesting verification';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_uid AND is_verified) THEN
    RAISE EXCEPTION 'Your account is already verified';
  END IF;
  IF COALESCE(NULLIF(trim(p_linkedin_url), ''), NULLIF(trim(p_company_registration), ''),
              NULLIF(trim(p_website_url), '')) IS NULL THEN
    RAISE EXCEPTION 'Please provide at least one verification document';
  END IF;

  SELECT * INTO v_existing FROM verification_requests
  WHERE user_id = v_uid ORDER BY created_at DESC LIMIT 1;

  IF FOUND AND v_existing.status IN ('pending', 'rejected', 'info_needed') THEN
    UPDATE verification_requests SET
      linkedin_url = NULLIF(trim(p_linkedin_url), ''),
      company_registration = NULLIF(trim(p_company_registration), ''),
      website_url = NULLIF(trim(p_website_url), ''),
      notes = NULLIF(trim(p_notes), ''),
      status = 'pending',
      rejection_reason = NULL,
      reviewed_by = NULL,
      reviewed_at = NULL,
      updated_at = NOW()
    WHERE id = v_existing.id
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO verification_requests (user_id, status, linkedin_url, company_registration, website_url, notes)
    VALUES (v_uid, 'pending', NULLIF(trim(p_linkedin_url), ''), NULLIF(trim(p_company_registration), ''),
            NULLIF(trim(p_website_url), ''), NULLIF(trim(p_notes), ''))
    RETURNING id INTO v_id;
  END IF;

  -- Notify active moderators / super admins
  SELECT full_name INTO v_name FROM profiles WHERE id = v_uid;
  FOR r IN SELECT id FROM admin_users WHERE is_active AND role IN ('super_admin', 'moderator') LOOP
    PERFORM public._notify(r.id, 'admin_verification', 'New verification request',
      COALESCE(v_name, 'A user') || ' requested account verification', '/admin/verifications',
      jsonb_build_object('request_id', v_id, 'user_id', v_uid));
  END LOOP;

  RETURN json_build_object('id', v_id, 'status', 'pending');
END;
$$;
REVOKE ALL ON FUNCTION public.submit_verification_request(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_verification_request(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. ADMIN RPCs - VERIFICATION
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_verification_requests(p_status TEXT DEFAULT 'pending')
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v JSON;
BEGIN
  PERFORM public._require_admin();
  SELECT COALESCE(json_agg(x ORDER BY x.created_at DESC), '[]'::json) INTO v
  FROM (
    SELECT vr.*,
      json_build_object(
        'id', p.id, 'full_name', p.full_name, 'email', u.email, 'avatar_url', p.avatar_url,
        'user_type', p.user_type, 'country', p.country, 'city', p.city, 'industry', p.industry,
        'bio', p.bio, 'linkedin_url', p.linkedin_url, 'website_url', p.website_url,
        'is_verified', p.is_verified, 'created_at', p.created_at
      ) AS profile
    FROM verification_requests vr
    LEFT JOIN profiles p ON p.id = vr.user_id
    LEFT JOIN auth.users u ON u.id = vr.user_id
    WHERE p_status IS NULL OR p_status = 'all' OR vr.status = p_status
  ) x;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_verification(
  p_request_id UUID, p_decision TEXT, p_reason TEXT DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_user UUID;
BEGIN
  PERFORM public._require_admin(ARRAY['super_admin', 'moderator']);
  IF p_decision NOT IN ('approved', 'rejected', 'info_needed') THEN
    RAISE EXCEPTION 'Invalid decision: %', p_decision;
  END IF;
  IF p_decision IN ('rejected', 'info_needed') AND COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'A reason is required';
  END IF;

  UPDATE verification_requests SET
    status = p_decision,
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    rejection_reason = CASE WHEN p_decision = 'approved' THEN NULL ELSE p_reason END,
    admin_notes = COALESCE(p_reason, admin_notes),
    updated_at = NOW()
  WHERE id = p_request_id
  RETURNING user_id INTO v_user;

  IF v_user IS NULL THEN RAISE EXCEPTION 'Verification request not found'; END IF;

  IF p_decision = 'approved' THEN
    UPDATE profiles SET is_verified = true, verified_at = NOW(), verified_by = auth.uid()
    WHERE id = v_user;
    PERFORM public._notify(v_user, 'verification', 'You are verified!',
      'Your account has been verified. Your verified badge is now visible on your profile.',
      '/profile/' || v_user, jsonb_build_object('request_id', p_request_id, 'status', 'approved'));
    PERFORM public._log_admin('verify_user', 'user', v_user, jsonb_build_object('verification_request_id', p_request_id));
  ELSIF p_decision = 'rejected' THEN
    PERFORM public._notify(v_user, 'verification', 'Verification request not approved',
      'Reason: ' || p_reason || '. You can update your details and resubmit.',
      '/settings/verification', jsonb_build_object('request_id', p_request_id, 'status', 'rejected'));
    PERFORM public._log_admin('reject_verification', 'user', v_user, jsonb_build_object('verification_request_id', p_request_id, 'reason', p_reason));
  ELSE
    PERFORM public._notify(v_user, 'verification', 'More information needed for verification',
      p_reason, '/settings/verification', jsonb_build_object('request_id', p_request_id, 'status', 'info_needed'));
    PERFORM public._log_admin('request_verification_info', 'user', v_user, jsonb_build_object('verification_request_id', p_request_id, 'reason', p_reason));
  END IF;

  RETURN json_build_object('request_id', p_request_id, 'user_id', v_user, 'status', p_decision);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_verified(p_user_id UUID, p_verified BOOLEAN)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin(ARRAY['super_admin', 'moderator']);
  UPDATE profiles SET
    is_verified = p_verified,
    verified_at = CASE WHEN p_verified THEN NOW() ELSE NULL END,
    verified_by = CASE WHEN p_verified THEN auth.uid() ELSE NULL END
  WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;

  IF p_verified THEN
    UPDATE verification_requests SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id AND status IN ('pending', 'info_needed');
    PERFORM public._notify(p_user_id, 'verification', 'You are verified!',
      'Your account has been verified by the AfroConnect team.', '/profile/' || p_user_id, NULL);
  END IF;
  PERFORM public._log_admin(CASE WHEN p_verified THEN 'verify_user' ELSE 'unverify_user' END, 'user', p_user_id, NULL);
  RETURN json_build_object('user_id', p_user_id, 'is_verified', p_verified);
END;
$$;

-- ---------------------------------------------------------------------
-- 6. ADMIN RPCs - CONTENT MODERATION (opportunities / events)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_moderate_content(
  p_content_type TEXT, p_content_id UUID, p_decision TEXT, p_notes TEXT DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_title TEXT;
  v_label TEXT;
  v_live_link TEXT;
  v_my_link TEXT;
BEGIN
  PERFORM public._require_admin(ARRAY['super_admin', 'moderator']);
  IF p_decision NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Invalid decision: %', p_decision;
  END IF;

  IF p_content_type = 'opportunity' THEN
    UPDATE opportunities SET moderation_status = p_decision, moderated_by = auth.uid(),
      moderated_at = NOW(), moderation_notes = p_notes
    WHERE id = p_content_id RETURNING creator_id, title INTO v_owner, v_title;
    v_label := 'opportunity';
    v_live_link := '/opportunities/' || p_content_id;
    v_my_link := '/opportunities/my';
  ELSIF p_content_type = 'event' THEN
    UPDATE events SET moderation_status = p_decision, moderated_by = auth.uid(),
      moderated_at = NOW(), moderation_notes = p_notes
    WHERE id = p_content_id RETURNING organizer_id, title INTO v_owner, v_title;
    v_label := 'event';
    v_live_link := '/events/' || p_content_id;
    v_my_link := '/events/my';
  ELSE
    RAISE EXCEPTION 'Invalid content type: %', p_content_type;
  END IF;

  IF v_title IS NULL THEN RAISE EXCEPTION '% not found', initcap(v_label); END IF;

  IF v_owner IS DISTINCT FROM auth.uid() THEN
    IF p_decision = 'approved' THEN
      PERFORM public._notify(v_owner, p_content_type, 'Your ' || v_label || ' is live!',
        '"' || v_title || '" has been approved and is now visible to everyone.',
        v_live_link, jsonb_build_object('content_id', p_content_id, 'status', 'approved'));
    ELSIF p_decision = 'rejected' THEN
      PERFORM public._notify(v_owner, p_content_type, 'Your ' || v_label || ' was not approved',
        '"' || v_title || '" was not approved' || COALESCE('. Reason: ' || NULLIF(trim(p_notes), ''), '') ||
        '. You can edit it and it will be re-reviewed.',
        v_my_link, jsonb_build_object('content_id', p_content_id, 'status', 'rejected'));
    END IF;
  END IF;

  PERFORM public._log_admin(
    CASE p_decision WHEN 'approved' THEN 'approve_content' WHEN 'rejected' THEN 'reject_content' ELSE 'reset_moderation' END,
    p_content_type, p_content_id, jsonb_build_object('title', v_title, 'notes', p_notes));

  RETURN json_build_object('id', p_content_id, 'moderation_status', p_decision);
END;
$$;

-- ---------------------------------------------------------------------
-- 7. ADMIN RPCs - REPORTS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_reports(p_status TEXT DEFAULT 'pending')
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v JSON;
BEGIN
  PERFORM public._require_admin();
  SELECT COALESCE(json_agg(x ORDER BY x.created_at DESC), '[]'::json) INTO v
  FROM (
    SELECT cr.*,
      json_build_object('id', rp.id, 'full_name', rp.full_name, 'email', ru.email) AS reporter,
      CASE WHEN cr.reported_user_id IS NULL THEN NULL ELSE
        json_build_object('id', up.id, 'full_name', up.full_name, 'email', uu.email,
          'is_banned', EXISTS (SELECT 1 FROM user_bans b WHERE b.user_id = cr.reported_user_id AND b.is_active
                               AND (b.expires_at IS NULL OR b.expires_at > NOW())))
      END AS reported_user,
      CASE cr.reported_content_type
        WHEN 'opportunity' THEN (SELECT o.title FROM opportunities o WHERE o.id = cr.reported_content_id)
        WHEN 'event' THEN (SELECT e.title FROM events e WHERE e.id = cr.reported_content_id)
        WHEN 'user' THEN up.full_name
        ELSE NULL
      END AS content_title,
      CASE cr.reported_content_type
        WHEN 'opportunity' THEN (SELECT o.moderation_status FROM opportunities o WHERE o.id = cr.reported_content_id)
        WHEN 'event' THEN (SELECT e.moderation_status FROM events e WHERE e.id = cr.reported_content_id)
        ELSE NULL
      END AS content_moderation_status
    FROM content_reports cr
    LEFT JOIN profiles rp ON rp.id = cr.reporter_id
    LEFT JOIN auth.users ru ON ru.id = cr.reporter_id
    LEFT JOIN profiles up ON up.id = cr.reported_user_id
    LEFT JOIN auth.users uu ON uu.id = cr.reported_user_id
    WHERE p_status IS NULL OR p_status = 'all' OR cr.status = p_status
  ) x;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_report(
  p_report_id UUID, p_status TEXT, p_notes TEXT DEFAULT NULL, p_remove_content BOOLEAN DEFAULT false
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r content_reports%ROWTYPE;
BEGIN
  PERFORM public._require_admin(ARRAY['super_admin', 'moderator', 'support']);
  IF p_status NOT IN ('pending', 'reviewing', 'resolved', 'dismissed') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  UPDATE content_reports SET
    status = p_status,
    assigned_to = COALESCE(assigned_to, auth.uid()),
    resolution_notes = COALESCE(NULLIF(trim(p_notes), ''), resolution_notes),
    resolved_by = CASE WHEN p_status IN ('resolved', 'dismissed') THEN auth.uid() ELSE resolved_by END,
    resolved_at = CASE WHEN p_status IN ('resolved', 'dismissed') THEN NOW() ELSE resolved_at END,
    updated_at = NOW()
  WHERE id = p_report_id
  RETURNING * INTO r;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Report not found'; END IF;

  IF p_remove_content AND r.reported_content_type IN ('opportunity', 'event') AND r.reported_content_id IS NOT NULL THEN
    IF NOT public.is_admin(ARRAY['super_admin', 'moderator']) THEN
      RAISE EXCEPTION 'Only moderators can remove content';
    END IF;
    PERFORM public.admin_moderate_content(r.reported_content_type, r.reported_content_id, 'rejected',
      COALESCE(NULLIF(trim(p_notes), ''), 'Removed following a user report'));
  END IF;

  IF p_status IN ('resolved', 'dismissed') THEN
    PERFORM public._notify(r.reporter_id, 'report', 'Your report has been reviewed',
      CASE WHEN p_status = 'resolved' THEN 'Thank you. Our team reviewed your report and took action.'
           ELSE 'Thank you. Our team reviewed your report and found no violation.' END,
      NULL, jsonb_build_object('report_id', r.id, 'status', p_status));
  END IF;

  PERFORM public._log_admin(CASE WHEN p_status = 'dismissed' THEN 'dismiss_report' ELSE 'resolve_report' END,
    'report', r.id, jsonb_build_object('status', p_status, 'notes', p_notes, 'removed_content', p_remove_content));
  RETURN json_build_object('id', r.id, 'status', p_status);
END;
$$;

-- ---------------------------------------------------------------------
-- 8. ADMIN RPCs - USERS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v JSON;
BEGIN
  PERFORM public._require_admin();
  SELECT COALESCE(json_agg(x ORDER BY x.created_at DESC), '[]'::json) INTO v
  FROM (
    SELECT p.id, p.full_name, u.email, p.avatar_url, p.user_type, p.country, p.city, p.industry,
           p.bio, p.is_verified, p.verified_at, p.is_active, p.created_at,
           u.last_sign_in_at,
           EXISTS (SELECT 1 FROM user_bans b WHERE b.user_id = p.id AND b.is_active
                   AND (b.expires_at IS NULL OR b.expires_at > NOW())) AS is_banned,
           EXISTS (SELECT 1 FROM verification_requests vr WHERE vr.user_id = p.id AND vr.status = 'pending') AS has_pending_verification,
           EXISTS (SELECT 1 FROM admin_users a WHERE a.id = p.id) AS is_staff
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
  ) x;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_user(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v JSON;
BEGIN
  PERFORM public._require_admin();
  SELECT json_build_object(
    'profile', to_jsonb(p) || jsonb_build_object('email', u.email, 'last_sign_in_at', u.last_sign_in_at),
    'is_banned', EXISTS (SELECT 1 FROM user_bans b WHERE b.user_id = p.id AND b.is_active
                         AND (b.expires_at IS NULL OR b.expires_at > NOW())),
    'active_ban', (SELECT to_json(b) FROM user_bans b WHERE b.user_id = p.id AND b.is_active
                   AND (b.expires_at IS NULL OR b.expires_at > NOW()) ORDER BY b.created_at DESC LIMIT 1),
    'is_staff', EXISTS (SELECT 1 FROM admin_users a WHERE a.id = p.id),
    'connections_count', (SELECT COUNT(*) FROM connections c
                          WHERE (c.requester_id = p.id OR c.addressee_id = p.id) AND c.status = 'accepted'),
    'verification_requests', COALESCE((SELECT json_agg(vr ORDER BY vr.created_at DESC) FROM verification_requests vr
                                       WHERE vr.user_id = p.id), '[]'::json)
  ) INTO v
  FROM profiles p LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.id = p_user_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_ban_user(
  p_user_id UUID, p_reason TEXT, p_ban_type TEXT DEFAULT 'temporary', p_days INT DEFAULT 7
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_expires TIMESTAMPTZ;
BEGIN
  PERFORM public._require_admin(ARRAY['super_admin', 'moderator']);
  IF COALESCE(trim(p_reason), '') = '' THEN RAISE EXCEPTION 'A reason is required'; END IF;
  IF p_ban_type NOT IN ('temporary', 'permanent') THEN RAISE EXCEPTION 'Invalid ban type'; END IF;
  IF p_user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot ban yourself'; END IF;
  IF EXISTS (SELECT 1 FROM admin_users WHERE id = p_user_id AND is_active) THEN
    RAISE EXCEPTION 'Deactivate this staff member before banning them';
  END IF;

  v_expires := CASE WHEN p_ban_type = 'temporary' THEN NOW() + make_interval(days => GREATEST(COALESCE(p_days, 7), 1)) ELSE NULL END;
  UPDATE user_bans SET is_active = false, updated_at = NOW() WHERE user_id = p_user_id AND is_active;
  INSERT INTO user_bans (user_id, banned_by, reason, ban_type, expires_at, is_active)
  VALUES (p_user_id, auth.uid(), p_reason, p_ban_type, v_expires, true);
  UPDATE profiles SET is_active = false WHERE id = p_user_id;

  PERFORM public._log_admin('ban_user', 'user', p_user_id, jsonb_build_object('reason', p_reason, 'ban_type', p_ban_type, 'expires_at', v_expires));
  RETURN json_build_object('user_id', p_user_id, 'expires_at', v_expires);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unban_user(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin(ARRAY['super_admin', 'moderator']);
  UPDATE user_bans SET is_active = false, updated_at = NOW() WHERE user_id = p_user_id AND is_active;
  UPDATE profiles SET is_active = true WHERE id = p_user_id;
  PERFORM public._log_admin('unban_user', 'user', p_user_id, NULL);
  RETURN json_build_object('user_id', p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE v_email TEXT; v_name TEXT;
BEGIN
  PERFORM public._require_admin(ARRAY['super_admin']);
  IF p_user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot delete your own account here'; END IF;
  IF EXISTS (SELECT 1 FROM admin_users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Remove this user from staff before deleting them';
  END IF;
  SELECT u.email, p.full_name INTO v_email, v_name
  FROM auth.users u LEFT JOIN profiles p ON p.id = u.id WHERE u.id = p_user_id;

  PERFORM public._log_admin('delete_user', 'user', p_user_id, jsonb_build_object('email', v_email, 'name', v_name));
  -- Deleting the auth user cascades to profiles and related rows
  DELETE FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    DELETE FROM profiles WHERE id = p_user_id;
  END IF;
  RETURN json_build_object('user_id', p_user_id, 'deleted', true);
END;
$$;

-- ---------------------------------------------------------------------
-- 9. ADMIN RPCs - STATS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_platform_stats()
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v JSON;
BEGIN
  PERFORM public._require_admin();
  SELECT json_build_object(
    'total_users',            (SELECT COUNT(*) FROM profiles),
    'active_users_7d',        (SELECT COUNT(*) FROM auth.users u JOIN profiles p ON p.id = u.id
                               WHERE u.last_sign_in_at >= NOW() - INTERVAL '7 days'),
    'new_users_30d',          (SELECT COUNT(*) FROM profiles WHERE created_at >= NOW() - INTERVAL '30 days'),
    'verified_users',         (SELECT COUNT(*) FROM profiles WHERE is_verified),
    'banned_users',           (SELECT COUNT(DISTINCT user_id) FROM user_bans WHERE is_active AND (expires_at IS NULL OR expires_at > NOW())),
    'total_opportunities',    (SELECT COUNT(*) FROM opportunities),
    'active_opportunities',   (SELECT COUNT(*) FROM opportunities WHERE status = 'active' AND COALESCE(moderation_status, 'approved') = 'approved'),
    'pending_opportunities',  (SELECT COUNT(*) FROM opportunities WHERE moderation_status = 'pending'),
    'total_events',           (SELECT COUNT(*) FROM events),
    'upcoming_events',        (SELECT COUNT(*) FROM events WHERE start_date >= NOW() AND status = 'published' AND COALESCE(moderation_status, 'approved') = 'approved'),
    'pending_events',         (SELECT COUNT(*) FROM events WHERE moderation_status = 'pending'),
    'total_connections',      (SELECT COUNT(*) FROM connections WHERE status = 'accepted'),
    'pending_verifications',  (SELECT COUNT(*) FROM verification_requests WHERE status = 'pending'),
    'pending_reports',        (SELECT COUNT(*) FROM content_reports WHERE status = 'pending'),
    'users_by_type',          (SELECT COALESCE(json_object_agg(t, c), '{}'::json) FROM
                                (SELECT COALESCE(user_type, 'unknown') t, COUNT(*) c FROM profiles GROUP BY 1) s),
    'users_by_country',       (SELECT COALESCE(json_object_agg(t, c), '{}'::json) FROM
                                (SELECT COALESCE(NULLIF(trim(country), ''), 'Unknown') t, COUNT(*) c FROM profiles GROUP BY 1) s)
  ) INTO v;
  RETURN v;
END;
$$;

-- ---------------------------------------------------------------------
-- 10. ADMIN RPCs - STAFF
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_add_staff(p_email TEXT, p_full_name TEXT, p_role TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE v_id UUID; v_email TEXT;
BEGIN
  PERFORM public._require_admin(ARRAY['super_admin']);
  IF p_role NOT IN ('super_admin', 'moderator', 'support', 'analytics') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;
  SELECT id, email INTO v_id, v_email FROM auth.users WHERE lower(email) = lower(trim(p_email)) LIMIT 1;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'User not found. They must register on AfroConnect first.';
  END IF;
  -- free up the email if an orphan placeholder row (e.g. seed admin) holds it
  DELETE FROM admin_users WHERE lower(email) = lower(v_email) AND id <> v_id
    AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_users.id);

  INSERT INTO admin_users (id, email, full_name, role, is_active, created_by, password_hash)
  VALUES (v_id, v_email, COALESCE(NULLIF(trim(p_full_name), ''), v_email), p_role, true, auth.uid(), 'managed_by_supabase_auth')
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name, is_active = true, updated_at = NOW();

  PERFORM public._log_admin('create_staff', 'admin', v_id, jsonb_build_object('email', v_email, 'role', p_role));
  RETURN json_build_object('id', v_id, 'email', v_email, 'role', p_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_staff(p_admin_id UUID, p_is_active BOOLEAN DEFAULT NULL, p_role TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin(ARRAY['super_admin']);
  IF p_admin_id = auth.uid() THEN RAISE EXCEPTION 'You cannot change your own staff status or role'; END IF;
  IF p_role IS NOT NULL AND p_role NOT IN ('super_admin', 'moderator', 'support', 'analytics') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;
  UPDATE admin_users SET
    is_active = COALESCE(p_is_active, is_active),
    role = COALESCE(p_role, role),
    updated_at = NOW()
  WHERE id = p_admin_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Staff member not found'; END IF;
  PERFORM public._log_admin(
    CASE WHEN p_is_active IS FALSE THEN 'deactivate_staff' WHEN p_is_active IS TRUE THEN 'activate_staff' ELSE 'update_staff' END,
    'admin', p_admin_id, jsonb_build_object('is_active', p_is_active, 'role', p_role));
  RETURN json_build_object('id', p_admin_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_remove_staff(p_admin_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin(ARRAY['super_admin']);
  IF p_admin_id = auth.uid() THEN RAISE EXCEPTION 'You cannot remove yourself'; END IF;
  PERFORM public._log_admin('delete_staff', 'admin', p_admin_id,
    (SELECT jsonb_build_object('email', email, 'role', role) FROM admin_users WHERE id = p_admin_id));
  DELETE FROM admin_users WHERE id = p_admin_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Staff member not found'; END IF;
  RETURN json_build_object('id', p_admin_id, 'deleted', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_touch_login()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE admin_users SET last_login = NOW() WHERE id = auth.uid() AND is_active;
END;
$$;

-- ---------------------------------------------------------------------
-- 11. GRANTS for admin RPCs (authorization is enforced inside each one)
-- ---------------------------------------------------------------------
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'admin_list_verification_requests(text)',
    'admin_review_verification(uuid,text,text)',
    'admin_set_user_verified(uuid,boolean)',
    'admin_moderate_content(text,uuid,text,text)',
    'admin_list_reports(text)',
    'admin_update_report(uuid,text,text,boolean)',
    'admin_list_users()',
    'admin_get_user(uuid)',
    'admin_ban_user(uuid,text,text,integer)',
    'admin_unban_user(uuid)',
    'admin_delete_user(uuid)',
    'admin_platform_stats()',
    'admin_add_staff(text,text,text)',
    'admin_update_staff(uuid,boolean,text)',
    'admin_remove_staff(uuid)',
    'admin_touch_login()'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- 12. SANITY CHECKS (results shown in SQL editor)
-- ---------------------------------------------------------------------
SELECT 'admins' AS item, COUNT(*)::text AS value FROM admin_users WHERE is_active
UNION ALL SELECT 'admins_without_auth_account', COUNT(*)::text FROM admin_users a WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = a.id)
UNION ALL SELECT 'pending_verifications', COUNT(*)::text FROM verification_requests WHERE status = 'pending'
UNION ALL SELECT 'pending_opportunities', COUNT(*)::text FROM opportunities WHERE moderation_status = 'pending'
UNION ALL SELECT 'pending_events', COUNT(*)::text FROM events WHERE moderation_status = 'pending'
UNION ALL SELECT 'unverified_users', COUNT(*)::text FROM profiles WHERE NOT COALESCE(is_verified, false);
