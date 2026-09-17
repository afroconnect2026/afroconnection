# 🛡️ Admin Portal - Phase 2 Development Plan

**Project:** AfroConnect Admin Control Panel  
**Phase:** 2 - Post-Launch Administration  
**Status:** 📝 Planning  
**Start Date:** TBD (After customer payment)

---

## 🎯 OBJECTIVE

Build a comprehensive admin portal that gives platform administrators **total control** over:
- ✅ User verification and moderation
- ✅ Content moderation (opportunities, events)
- ✅ Analytics and reporting
- ✅ System configuration
- ✅ Security and access control

---

## 👥 ADMIN ROLES & PERMISSIONS

### 1. **Super Admin** (Full Access)
- Complete system control
- Manage other admins
- Access all features
- System configuration
- Database access

### 2. **Content Moderator**
- Review and approve content
- Verify users
- Moderate opportunities and events
- Handle reports

### 3. **Support Admin**
- View user profiles
- Handle support tickets
- Access user data (read-only)
- No delete permissions

### 4. **Analytics Viewer**
- View dashboards only
- Export reports
- No edit permissions

---

## 📋 CORE FEATURES

### 🔐 **1. Authentication & Access Control**

**Admin Login:**
- Separate admin login portal (`/admin/login`)
- Two-factor authentication (2FA) required
- Email + Password + OTP
- Session timeout: 30 minutes
- IP whitelisting option

**Database Schema:**
```sql
CREATE TABLE admin_users (
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
  created_by UUID REFERENCES admin_users(id)
);

CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL, -- 'verify_user', 'delete_post', 'ban_user', etc.
  target_type TEXT, -- 'user', 'opportunity', 'event', etc.
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### ✅ **2. User Verification System**

**Verification Dashboard:**
- Pending verification requests queue
- User profile review interface
- Document upload review
- Manual verification approval/rejection

**Verification Criteria:**
- Profile completeness (100%)
- Email verification ✅
- Phone verification ✅
- LinkedIn profile verification
- Government ID upload (optional)
- Company registration (for companies)

**Verification Workflow:**
```
User submits verification request
  ↓
Admin reviews profile + documents
  ↓
Admin decision: Approve / Reject / Request More Info
  ↓
User gets verified badge ✅ or notification
  ↓
Logged in admin_activity_log
```

**Database Schema:**
```sql
CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'info_needed')),
  request_type TEXT DEFAULT 'profile_verification',
  documents JSONB, -- URLs to uploaded documents
  linkedin_url TEXT,
  company_registration TEXT,
  notes TEXT, -- User's notes
  admin_notes TEXT, -- Admin's internal notes
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add to profiles table
ALTER TABLE profiles ADD COLUMN verification_badge_url TEXT;
ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN verified_by UUID REFERENCES admin_users(id);
```

---

### 📊 **3. Admin Dashboard**

**Main Dashboard (`/admin/dashboard`):**

**Key Metrics:**
- Total Users (with breakdown by type)
- Active Users (last 7 days)
- Pending Verifications
- Flagged Content
- Revenue (if applicable)
- AI API Usage & Costs

**Real-time Charts:**
- User growth over time
- Daily active users
- Top countries
- Most active features
- Connection graph

**Quick Actions:**
- Verify pending users
- Review flagged content
- Send platform announcements
- System health check

---

### 👤 **4. User Management**

**User List (`/admin/users`):**
- Search by name, email, location
- Filter by: user_type, is_verified, is_active, country
- Sort by: created_at, last_active, connections_count
- Bulk actions: verify, ban, delete

**User Details Page (`/admin/users/[id]`):**
```
┌─────────────────────────────────────────┐
│ User Profile Overview                   │
├─────────────────────────────────────────┤
│ • Full profile data                     │
│ • Verification status                   │
│ • Account activity timeline             │
│ • Connections (count + list)            │
│ • Opportunities posted                  │
│ • Events created                        │
│ • Messages sent/received (count)        │
│ • Reports against this user             │
│ • AI feature usage                      │
└─────────────────────────────────────────┘

Admin Actions:
[✅ Verify User]  [🚫 Ban User]  [📧 Email User]
[⚠️ Flag Account] [🗑️ Delete User] [📝 Add Note]
```

**User Actions:**
- **Verify User** - Grant verification badge
- **Ban User** - Suspend account (temporary/permanent)
- **Delete User** - Remove account + all data (GDPR compliant)
- **Email User** - Send admin message
- **Reset Password** - Force password reset
- **View Login History** - See all login attempts
- **Impersonate User** (with audit trail) - For debugging

---

### 📝 **5. Content Moderation**

**Opportunities Moderation (`/admin/opportunities`):**
- Review all posted opportunities
- Approve/reject new opportunities
- Flag inappropriate content
- Edit/delete opportunities
- See applicant count

**Events Moderation (`/admin/events`):**
- Review all events
- Approve/reject events
- Monitor attendance
- Cancel events
- Refund management (if paid events)

**Moderation Queue:**
```
Pending Review (23)
├─ New Opportunities (12)
├─ New Events (8)
├─ Flagged Content (3)
└─ User Reports (5)

[Auto-approve]  [Approve]  [Reject]  [Flag]  [Delete]
```

**Content Flags:**
- Spam
- Inappropriate content
- Scam/Fraud
- Duplicate
- Outdated
- Wrong category

---

### 🚨 **6. Reports & Flagging System**

**User Reports Dashboard:**
- View all user-reported content
- Filter by: report_type, status, severity
- Assign to moderators
- Track resolution

**Report Types:**
- User harassment
- Spam content
- Fake profile
- Inappropriate opportunity
- Scam event
- Other

**Database Schema:**
```sql
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id),
  reported_user_id UUID REFERENCES profiles(id),
  reported_content_type TEXT, -- 'opportunity', 'event', 'message', 'profile'
  reported_content_id UUID,
  report_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES admin_users(id),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES admin_users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 📈 **7. Analytics & Reports**

**Analytics Dashboard (`/admin/analytics`):**

**User Analytics:**
- Total users by type
- User growth trends
- Retention rate
- Churn rate
- Most active users
- Geographic distribution

**Engagement Metrics:**
- Daily/Weekly/Monthly active users
- Average session duration
- Feature usage (opportunities, events, messaging)
- Connection acceptance rate
- Message response rate

**Content Analytics:**
- Opportunities posted per day
- Events created per month
- Most popular opportunity types
- Most attended events
- Application conversion rate

**AI Usage Analytics:**
- Bio enhancement requests
- AI match calculations
- Conversation starters generated
- API costs breakdown
- Rate limit hits

**Export Reports:**
- PDF reports
- CSV exports
- Excel spreadsheets
- Scheduled email reports

---

### ⚙️ **8. System Configuration**

**Settings Dashboard (`/admin/settings`):**

**Platform Settings:**
- Platform name and description
- Contact email
- Social media links
- Maintenance mode ON/OFF
- User registration ON/OFF
- Feature flags

**Email Templates:**
- Welcome email
- Verification email
- Password reset
- Notification emails
- Admin alerts

**AI Configuration:**
- OpenAI API key management
- Rate limits per feature
- AI feature ON/OFF toggles
- Cost monitoring alerts

**Storage Settings:**
- Supabase storage limits
- File upload size limits
- Allowed file types
- CDN configuration

---

### 🔔 **9. Notifications & Alerts**

**Admin Notifications:**
- New verification request
- Content flagged
- User banned
- System errors
- API quota warnings
- Security alerts

**Notification Channels:**
- Email
- SMS (Twilio)
- Slack integration
- Dashboard notifications

---

### 📧 **10. Communication Tools**

**Broadcast Messages:**
- Send email to all users
- Send to specific user segments
- Schedule announcements
- Push notifications

**Support Tickets:**
- View all support requests
- Assign to support admins
- Track response time
- Close tickets

---

## 🎨 ADMIN PORTAL DESIGN

### **Color Scheme:**
- Primary: Dark blue (#1e40af)
- Success: Green (#10b981)
- Warning: Orange (#f59e0b)
- Danger: Red (#ef4444)
- Background: Light gray (#f9fafb)

### **Layout:**
```
┌──────────────────────────────────────────────────┐
│ [Logo] AfroConnect Admin        [User] [Logout] │
├────────┬─────────────────────────────────────────┤
│        │ Dashboard Content                       │
│ MENU   │                                         │
│        │ [Metrics] [Charts] [Quick Actions]      │
│ 📊 Dash│                                         │
│ 👥 User│                                         │
│ ✅ Veri│                                         │
│ 📝 Cont│                                         │
│ 🚨 Repo│                                         │
│ 📈 Anal│                                         │
│ ⚙️ Sett│                                         │
│        │                                         │
└────────┴─────────────────────────────────────────┘
```

---

## 🛠️ TECHNICAL STACK

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts (for analytics)
- React Table (for data tables)
- React Hook Form (for forms)

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL + Auth)
- Row Level Security (RLS)
- Serverless functions

**Authentication:**
- Supabase Auth
- Custom admin_users table
- 2FA with speakeasy/otplib

**Real-time:**
- Supabase Realtime subscriptions
- Live notifications
- Live dashboard updates

---

## 📁 FILE STRUCTURE

```
/app/admin/
├── layout.tsx              # Admin layout with sidebar
├── login/
│   └── page.tsx           # Admin login (2FA)
├── dashboard/
│   └── page.tsx           # Main dashboard
├── users/
│   ├── page.tsx           # User list
│   └── [id]/
│       └── page.tsx       # User details
├── verifications/
│   ├── page.tsx           # Verification queue
│   └── [id]/
│       └── page.tsx       # Review verification
├── opportunities/
│   └── page.tsx           # Opportunities moderation
├── events/
│   └── page.tsx           # Events moderation
├── reports/
│   └── page.tsx           # Content reports
├── analytics/
│   └── page.tsx           # Analytics dashboard
└── settings/
    └── page.tsx           # System settings

/components/admin/
├── AdminNav.tsx           # Admin sidebar
├── AdminHeader.tsx        # Admin top bar
├── UserCard.tsx           # User preview card
├── VerificationCard.tsx   # Verification request card
├── StatCard.tsx           # Metric display
├── ActivityLog.tsx        # Admin activity feed
└── charts/
    ├── UserGrowthChart.tsx
    ├── EngagementChart.tsx
    └── RevenueChart.tsx

/lib/admin/
├── permissions.ts         # Role-based access control
├── analytics.ts           # Analytics calculations
├── moderation.ts          # Content moderation helpers
└── notifications.ts       # Admin notification system
```

---

## 🔒 SECURITY MEASURES

1. **Separate Authentication**
   - Admin users NOT in regular users table
   - Different login portal
   - 2FA mandatory for super admins

2. **Role-Based Access Control (RBAC)**
   - Permissions checked on every action
   - Middleware protection on admin routes
   - Database-level RLS policies

3. **Activity Logging**
   - Every admin action logged
   - IP address tracking
   - User agent logging
   - Cannot be deleted by admins

4. **IP Whitelisting**
   - Optional IP restriction
   - Office IP only access
   - VPN required option

5. **Session Management**
   - 30-minute timeout
   - Auto-logout on inactivity
   - Force logout all sessions

---

## 📊 VERIFICATION PROCESS

### **Step 1: User Requests Verification**
```typescript
// User side: /profile/verify
- Upload profile photo
- Complete all profile fields
- Add LinkedIn profile
- Upload government ID (optional)
- Upload company registration (for companies)
- Submit request
```

### **Step 2: Admin Reviews**
```typescript
// Admin side: /admin/verifications
- View pending requests
- Check profile completeness
- Review uploaded documents
- Verify LinkedIn profile
- Check for duplicate accounts
- Decision: Approve / Reject / Request More Info
```

### **Step 3: User Gets Notified**
```typescript
// If approved:
- is_verified = true
- verified_at = NOW()
- verified_by = admin_id
- Send congratulations email
- Show badge on profile

// If rejected:
- Send email with reason
- Allow resubmission after fixes
```

---

## 💰 PRICING (If Applicable)

**Verification Badge:**
- Option 1: FREE for all (build trust)
- Option 2: $5-10 one-time fee
- Option 3: Included in premium subscription

**Premium Features:**
- Verified badge
- Featured profile
- Priority in search
- Analytics dashboard
- Unlimited connections

---

## 🚀 DEVELOPMENT PHASES

### **Phase 2.1: Foundation** (Week 1-2)
- [ ] Admin authentication system
- [ ] Admin user management
- [ ] Basic admin dashboard
- [ ] Activity logging system

### **Phase 2.2: Verification** (Week 3)
- [ ] Verification request system
- [ ] Document upload
- [ ] Admin verification review
- [ ] Badge display on profiles

### **Phase 2.3: Moderation** (Week 4)
- [ ] Content moderation dashboard
- [ ] Opportunities review
- [ ] Events review
- [ ] Reports system

### **Phase 2.4: Analytics** (Week 5)
- [ ] User analytics
- [ ] Engagement metrics
- [ ] AI usage tracking
- [ ] Export reports

### **Phase 2.5: Advanced Features** (Week 6)
- [ ] Broadcast messaging
- [ ] System configuration
- [ ] Email templates
- [ ] Support tickets

---

## 📝 NOTES

- Admin portal should be built AFTER customer payment
- Charge separately for admin portal (additional feature)
- Estimated development: 6-8 weeks
- Estimated cost: [TBD based on hours]

---

## ✅ DELIVERABLES

Once complete:
- ✅ Fully functional admin portal
- ✅ User verification system
- ✅ Content moderation tools
- ✅ Analytics dashboard
- ✅ System configuration
- ✅ Documentation for admins
- ✅ Training materials

---

**This plan is ready to be implemented once:**
1. Customer completes payment for Phase 1
2. New contract/SOW signed for Phase 2
3. Requirements confirmed with customer
4. Timeline and budget agreed upon

**Status:** 📝 **Planned - Awaiting Phase 1 Payment**
