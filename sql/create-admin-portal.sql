-- ============================================
-- AFROCONNECT ADMIN PORTAL - DATABASE SCHEMA
-- Complete admin system with verification, moderation, and analytics
-- ============================================

-- 1. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator', 'support', 'analytics')),
  is_active BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  last_login TIMESTAMPTZ,
  ip_whitelist TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADMIN ACTIVITY LOG
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VERIFICATION REQUESTS
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'info_needed')),
  request_type TEXT DEFAULT 'profile_verification',
  documents JSONB,
  linkedin_url TEXT,
  company_registration TEXT,
  notes TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CONTENT REPORTS
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_content_type TEXT,
  reported_content_id UUID,
  report_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES admin_users(id),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES admin_users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. USER BANS
CREATE TABLE IF NOT EXISTS user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  banned_by UUID REFERENCES admin_users(id),
  reason TEXT NOT NULL,
  ban_type TEXT CHECK (ban_type IN ('temporary', 'permanent')),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ADD VERIFICATION FIELDS TO PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES admin_users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_badge_url TEXT;

-- 7. ADD MODERATION FIELDS TO OPPORTUNITIES
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES admin_users(id);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- 8. ADD MODERATION FIELDS TO EVENTS
ALTER TABLE events ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES admin_users(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- 9. SYSTEM SETTINGS (for admin configuration)
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_severity ON content_reports(severity);
CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_is_active ON user_bans(is_active);

-- 11. ROW LEVEL SECURITY POLICIES FOR ADMIN TABLES

-- Admin users - only admins can view
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Admin activity log - read-only for all admins
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view activity log" ON admin_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Verification requests - admins can manage
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create verification requests" ON verification_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own verification requests" ON verification_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification requests" ON verification_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Content reports - users can create, admins can manage
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON content_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON content_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all reports" ON content_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- User bans - admins only
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage bans" ON user_bans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- System settings - admins only
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND is_active = true
      AND role IN ('super_admin')
    )
  );

-- 12. CREATE FIRST SUPER ADMIN (Update this with your details)
-- Password: Admin@123 (CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN)
INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@afroconnect.io',
  '$2a$10$YourHashedPasswordHere', -- This will be handled by the login system
  'System Administrator',
  'super_admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- 13. CREATE FUNCTIONS FOR ADMIN ANALYTICS

-- Function to get platform statistics
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_users_7d', (SELECT COUNT(DISTINCT id) FROM profiles WHERE last_active_at >= NOW() - INTERVAL '7 days'),
    'total_opportunities', (SELECT COUNT(*) FROM opportunities),
    'active_opportunities', (SELECT COUNT(*) FROM opportunities WHERE status = 'active'),
    'total_events', (SELECT COUNT(*) FROM events),
    'upcoming_events', (SELECT COUNT(*) FROM events WHERE end_date >= NOW()),
    'total_connections', (SELECT COUNT(*) FROM connections WHERE status = 'accepted'),
    'pending_verifications', (SELECT COUNT(*) FROM verification_requests WHERE status = 'pending'),
    'pending_reports', (SELECT COUNT(*) FROM content_reports WHERE status = 'pending')
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_details JSONB,
  p_ip_address TEXT,
  p_user_agent TEXT
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO admin_activity_log (
    admin_id,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_action,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICATION QUERIES (Run these to check everything is created)
-- ============================================

-- Check all admin tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('admin_users', 'admin_activity_log', 'verification_requests', 'content_reports', 'user_bans', 'system_settings')
ORDER BY table_name;

-- Check profiles has verification columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('is_verified', 'verified_at', 'verified_by', 'verification_badge_url')
ORDER BY column_name;

-- Check opportunities has moderation columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'opportunities'
AND column_name IN ('moderation_status', 'moderated_by', 'moderated_at', 'moderation_notes')
ORDER BY column_name;

-- Check events has moderation columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name IN ('moderation_status', 'moderated_by', 'moderated_at', 'moderation_notes')
ORDER BY column_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Admin Portal Database Schema Created Successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update the admin password hash in admin_users table';
  RAISE NOTICE '2. Access admin portal at /admin/login';
  RAISE NOTICE '3. Change default admin password immediately';
END $$;
