# 🚀 PHASE 2: CORE FUNCTIONALITY & ENGAGEMENT

**Goal:** Transform AfroConnect from a visual platform into a fully functional networking engine where users can discover, connect, and transact.

**Timeline:** 4-6 weeks  
**Priority:** Make the platform actually work for real users

---

## 📊 PHASE 1 RECAP (What We Built)

✅ **Foundation Complete:**
- 4 Type-specific dashboards (Entrepreneur, Investor, Professional, Company)
- Type-specific profiles with custom fields
- Photo upload (avatar + cover)
- Logo & branding system
- Legal pages (Privacy + Terms)
- Auth & security (RLS + middleware)
- Database schema (9 tables)

**What's Missing:** The platform looks great but doesn't DO anything yet. Users can't message, match, or transact.

---

## 🎯 PHASE 2: CORE FEATURES (Priority Order)

### **TIER 1: CRITICAL PATH (Must-Have for Launch)**

#### 1. **Real Messaging System** 🔴 **HIGHEST PRIORITY**
**Current State:** Messages table exists, no UI  
**What We Need:**
- [ ] Real-time messaging UI (conversations list + chat interface)
- [ ] Message notifications (unread count badges)
- [ ] Send/receive messages between users
- [ ] Message search and filters
- [ ] Real-time updates (Supabase Realtime)
- [ ] Message read receipts
- [ ] File attachments (images, PDFs)

**Why Critical:** Users can't connect without messaging. This is the #1 blocker.

**Estimated Time:** 1 week  
**Database:** Already done ✅ (messages, conversations tables exist)

---

#### 2. **Matching & Discovery Engine** 🔴 **CRITICAL**
**Current State:** Explore page shows all users, no smart matching  
**What We Need:**
- [ ] **AI-Powered Matching Algorithm:**
  - Entrepreneur ↔ Investor matches (based on industry, stage, ticket size)
  - Professional ↔ Company matches (based on skills, job openings)
  - Entrepreneur ↔ Professional matches (based on needs, expertise)
- [ ] **Match Feed on Dashboards:**
  - "Recommended for You" section on each dashboard
  - Match score/percentage (why they match)
  - "Connect" button to initiate conversation
- [ ] **Match Filters:**
  - Filter by match quality (90%+, 80%+, etc.)
  - Filter by user type
  - Filter by location/region
- [ ] **Save/Dismiss Matches:**
  - Save interesting profiles to watchlist
  - Dismiss profiles you're not interested in

**Why Critical:** This is the core value prop - connecting the right people.

**Estimated Time:** 1.5 weeks  
**Database:** `matches` table exists ✅, needs matching logic

---

#### 3. **Opportunities System (Full Implementation)** 🟡 **HIGH PRIORITY**
**Current State:** Opportunities table exists, basic listing page  
**What We Need:**
- [ ] **Post Opportunities:**
  - Job postings (for Companies)
  - Investment opportunities (for Entrepreneurs)
  - Consulting gigs (for Professionals)
  - Partnership opportunities (all types)
- [ ] **Opportunity Detail Pages:**
  - Full description, requirements, compensation
  - "Apply" button
  - Applicant tracking
- [ ] **Applications System:**
  - Apply to opportunities
  - Upload resume/pitch deck
  - Track application status (pending, reviewing, accepted, rejected)
  - Applicant inbox for opportunity owners
- [ ] **Opportunity Filters:**
  - By type (job, investment, gig, partnership)
  - By industry, location, remote/onsite
  - By compensation range

**Why High Priority:** Monetizable feature, drives engagement.

**Estimated Time:** 1 week  
**Database:** `opportunities` table exists ✅, need `applications` table

---

#### 4. **Notifications System** 🟡 **HIGH PRIORITY**
**Current State:** Bell icon exists, no functionality  
**What We Need:**
- [ ] **In-App Notifications:**
  - New message notifications
  - New match notifications
  - Opportunity application updates
  - Profile view notifications
- [ ] **Notification Center UI:**
  - Dropdown from bell icon
  - Mark as read/unread
  - Notification filters
- [ ] **Real-Time Updates:**
  - Live notification count badge
  - Browser notifications (optional)
- [ ] **Email Notifications:**
  - Daily digest of new matches
  - Important updates (new message, application status)
  - Weekly summary

**Why High Priority:** Keeps users engaged and coming back.

**Estimated Time:** 3-4 days  
**Database:** Need `notifications` table

---

### **TIER 2: ENGAGEMENT BOOSTERS (Launch Week)**

#### 5. **Profile Completeness & Onboarding**
**What We Need:**
- [ ] **Profile Completeness Indicator:**
  - Progress bar on profile page (0-100%)
  - Checklist of missing fields
  - Gamification (badges for 100% complete)
- [ ] **Guided Onboarding Flow:**
  - Step-by-step profile setup after registration
  - Skip vs. Complete options
  - Welcome tour of dashboard
- [ ] **Profile Strength Tips:**
  - Suggestions for improving profile visibility
  - "Add pitch deck to get 3x more investor views"

**Why Valuable:** Higher-quality profiles = better matches = more value.

**Estimated Time:** 2-3 days

---

#### 6. **Search & Filters Improvements**
**Current State:** Basic Explore page exists  
**What We Need:**
- [ ] **Advanced Search:**
  - Search by name, industry, location, skills
  - Filter by user type, availability, funding stage
  - Sort by: Recent, Most Active, Best Match
- [ ] **Saved Searches:**
  - Save filter combinations
  - Get alerts when new matches appear
- [ ] **Map View (Optional):**
  - Geographic view of users by location
  - Useful for diaspora connections

**Estimated Time:** 2-3 days

---

#### 7. **Activity Feed**
**What We Need:**
- [ ] **User Activity Stream:**
  - "John posted a new investment opportunity"
  - "Sarah completed her profile"
  - "Mike connected with 3 investors this week"
- [ ] **Feed Filters:**
  - My connections only
  - All activity
  - By activity type
- [ ] **Engagement Actions:**
  - Like, comment, share activities

**Why Valuable:** Social proof, community feel, FOMO.

**Estimated Time:** 3-4 days  
**Database:** Need `activities` table

---

### **TIER 3: PROFESSIONAL FEATURES (Post-Launch)**

#### 8. **Deal Flow & Pipeline (Investor Dashboard)**
**What We Need:**
- [ ] **Kanban Pipeline View:**
  - Columns: New, Reviewing, Due Diligence, Rejected, Invested
  - Drag-and-drop deal cards
- [ ] **Deal Notes:**
  - Private notes on each startup
  - Rating system (1-5 stars)
- [ ] **Investment Tracking:**
  - Track committed amounts
  - Portfolio performance dashboard

**Estimated Time:** 1 week

---

#### 9. **Pitch Deck Viewer**
**What We Need:**
- [ ] **Embedded PDF Viewer:**
  - View pitch decks in-browser (no download required)
  - Page navigation, zoom
- [ ] **Pitch Deck Analytics:**
  - Track who viewed your deck
  - Which slides they spent most time on
- [ ] **Feedback System:**
  - Investors can leave private feedback on decks

**Estimated Time:** 3-4 days

---

#### 10. **Application Tracking System (Company Dashboard)**
**What We Need:**
- [ ] **Applicant Pipeline:**
  - Columns: New, Screening, Interview, Offer, Rejected
  - Drag-and-drop applicant cards
- [ ] **Candidate Profiles:**
  - View full profiles + resumes
  - Rate candidates (1-5 stars)
  - Add interview notes
- [ ] **Communication:**
  - Send status updates to applicants
  - Schedule interviews

**Estimated Time:** 1 week

---

#### 11. **Portfolio Showcase (Professional Dashboard)**
**What We Need:**
- [ ] **Work Samples Gallery:**
  - Upload images, PDFs, links
  - Organize into projects
- [ ] **Client Testimonials:**
  - Request testimonials from connections
  - Display on profile
- [ ] **Availability Calendar:**
  - Show available hours/days
  - Book consultations (Calendly-style)

**Estimated Time:** 4-5 days

---

### **TIER 4: GROWTH & MONETIZATION (Month 2-3)**

#### 12. **Premium Features**
**What We Need:**
- [ ] **Subscription Tiers:**
  - Free: Basic profile, limited matches (10/month)
  - Pro ($19/mo): Unlimited matches, advanced filters, priority support
  - Enterprise ($99/mo): Team accounts, analytics, API access
- [ ] **Payment Integration:**
  - Stripe or Flutterwave
  - Billing dashboard
  - Invoice generation

**Estimated Time:** 1 week

---

#### 13. **Analytics Dashboard**
**What We Need:**
- [ ] **User Analytics:**
  - Profile views over time
  - Match success rate
  - Message response rate
- [ ] **Platform Analytics (Admin):**
  - Daily active users
  - New registrations
  - Most active regions
  - Conversion funnels

**Estimated Time:** 3-4 days

---

#### 14. **Referral Program**
**What We Need:**
- [ ] **Referral Links:**
  - Unique referral code per user
  - Track sign-ups via referral
- [ ] **Rewards:**
  - Free month of Pro for every 3 referrals
  - Leaderboard of top referrers
- [ ] **Sharing Tools:**
  - Share on social media
  - Email invitations

**Estimated Time:** 2-3 days

---

#### 15. **Email System**
**What We Need:**
- [ ] **Transactional Emails:**
  - Welcome email
  - Email verification
  - Password reset
- [ ] **Notification Emails:**
  - New message alert
  - New match alert
  - Weekly digest
- [ ] **Marketing Emails:**
  - Product updates
  - Success stories
  - Tips for better matches

**Tool:** Resend, SendGrid, or AWS SES  
**Estimated Time:** 3-4 days

---

## 🗓️ SUGGESTED PHASE 2 SPRINT PLAN

### **Week 1: Messaging Foundation**
- Day 1-2: Real-time messaging UI
- Day 3-4: Message notifications
- Day 5: Testing & polish

### **Week 2: Matching Engine**
- Day 1-3: Matching algorithm implementation
- Day 4-5: Match feed UI on dashboards

### **Week 3: Opportunities & Applications**
- Day 1-2: Post opportunity flow
- Day 3-4: Applications system
- Day 5: Opportunity detail pages

### **Week 4: Notifications & Polish**
- Day 1-2: Notifications system
- Day 3: Profile completeness
- Day 4-5: Search improvements

### **Week 5-6: Engagement Features**
- Activity feed
- Onboarding flow
- Testing & bug fixes

---

## 📊 PHASE 2 SUCCESS METRICS

**Technical:**
- [ ] Real-time messaging working
- [ ] 90%+ match accuracy
- [ ] <2s page load times
- [ ] Zero critical bugs

**User:**
- [ ] 50+ active users
- [ ] 100+ messages sent
- [ ] 200+ matches made
- [ ] 20+ opportunities posted

**Business:**
- [ ] 10+ investor-entrepreneur connections
- [ ] 5+ hires made through platform
- [ ] 3+ deals funded

---

## 🎯 PHASE 2 PRIORITIES (Ranked)

1. **Messaging** (Can't connect without it)
2. **Matching Algorithm** (Core value prop)
3. **Opportunities** (Monetizable, drives usage)
4. **Notifications** (Retention & engagement)
5. **Profile Completeness** (Data quality)
6. **Search Improvements** (Discoverability)
7. **Activity Feed** (Social proof)
8. **Professional Features** (Deal flow, pitch viewer, etc.)
9. **Premium Features** (Revenue)
10. **Analytics** (Growth insights)

---

## 🚀 RECOMMENDED APPROACH

**MVP Launch (4 weeks):**
- Messaging ✅
- Matching ✅
- Opportunities ✅
- Notifications ✅

**Then iterate based on user feedback.**

**What do you think? Should we start with this plan, or adjust priorities?**
