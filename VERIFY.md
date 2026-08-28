# AfroConnect - Verification Checklist

Use this checklist to verify the AfroConnect installation is complete and working.

---

## ✅ Installation Verification

### Step 1: Files & Folders

Check these files exist:

```bash
cd C:/Users/Admin/afroconnect
```

- [ ] `package.json` exists
- [ ] `app/page.tsx` exists (homepage)
- [ ] `app/auth/login/page.tsx` exists
- [ ] `app/auth/register/page.tsx` exists
- [ ] `supabase-schema.sql` exists
- [ ] `README.md` exists
- [ ] `SETUP-GUIDE.md` exists
- [ ] `HANDOVER.md` exists
- [ ] `node_modules/` folder exists (after `npm install`)

### Step 2: Dependencies Installed

```bash
npm list next react tailwindcss supabase
```

Should show:
- ✅ next@14.2.5
- ✅ react@18.3.1
- ✅ tailwindcss@3.4.7
- ✅ @supabase/supabase-js@2.45.0

### Step 3: Dev Server Running

```bash
npm run dev
```

Expected output:
```
✓ Ready in 7.4s
- Local: http://localhost:3500
```

### Step 4: Homepage Loads

Open browser: http://localhost:3500

**Expected**: Beautiful landing page with:
- ✅ AfroConnect logo/branding
- ✅ Hero section "Connect Africa to Global Opportunity"
- ✅ Green/Gold/Navy color scheme
- ✅ "Get Started" and "Explore Platform" buttons
- ✅ "Who We Serve" section (4 cards)
- ✅ "AI-Powered Features" section
- ✅ Footer with links

**Common Issues**:
- If you see errors, check browser console (F12)
- If page is blank, wait 10 seconds for build
- If port in use, change port in `package.json`

### Step 5: Registration Flow

Click "Get Started" button.

**Step 1 - Choose User Type**:
- ✅ See 4 cards: Entrepreneur, Investor, Professional, Company
- ✅ Click "Entrepreneur" - card highlights
- ✅ Click "Continue" - goes to Step 2

**Step 2 - Account Details**:
- ✅ See "Full Name", "Email", "Password" fields
- ✅ Fill in test data
- ✅ Click "Create Account"

**Expected behavior**:
- Shows "Account created! Check your email to verify"
- OR shows "Supabase error" (if Supabase not configured yet - this is OK for Phase 1 verification)

### Step 6: Login Page

Go to: http://localhost:3500/auth/login

**Expected**:
- ✅ See "Welcome Back" headline
- ✅ Email and Password fields
- ✅ "Forgot password?" link
- ✅ "Sign In" button
- ✅ "Or continue with" Google button
- ✅ "Don't have an account? Sign Up" link

### Step 7: Responsive Design

Open Chrome DevTools (F12) → Device toolbar (Ctrl+Shift+M)

Test these breakpoints:
- [ ] Mobile (375px) - Layout stacks vertically, nav collapses
- [ ] Tablet (768px) - 2-column grids
- [ ] Desktop (1920px) - Full layout

**All content should be readable, no horizontal scroll**

### Step 8: PWA Manifest

Go to: http://localhost:3500/manifest.json

**Expected**: JSON file with:
```json
{
  "name": "AfroConnect - Connecting Africa to Opportunity",
  "short_name": "AfroConnect",
  "icons": [...],
  ...
}
```

### Step 9: Database Schema

Open `supabase-schema.sql` in text editor.

**Expected**:
- ✅ 9 CREATE TABLE statements
- ✅ RLS policies (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
- ✅ Indexes (CREATE INDEX ...)
- ✅ Triggers (CREATE TRIGGER ...)

### Step 10: Documentation

Open and verify these docs:

- [ ] `README.md` - Has project overview, tech stack, installation
- [ ] `SETUP-GUIDE.md` - Has step-by-step Supabase setup
- [ ] `HANDOVER.md` - Has client checklist, costs, deliverables
- [ ] `PROJECT-SUMMARY.md` - Quick reference guide

---

## 🧪 Functional Testing (With Supabase)

**Note**: These tests require Supabase to be configured. If not done yet, skip this section.

### Test 1: Create Account

1. Go to http://localhost:3500/auth/register
2. Choose "Entrepreneur"
3. Fill in:
   - Name: Test User
   - Email: test@afroconnect.com
   - Password: TestPass123!
4. Click "Create Account"

**Expected**:
- ✅ Success message shown
- ✅ Redirected to /auth/verify-email (or /dashboard)
- ✅ User appears in Supabase → Authentication → Users
- ✅ Profile appears in Supabase → Table Editor → profiles

### Test 2: Login

1. Go to http://localhost:3500/auth/login
2. Enter:
   - Email: test@afroconnect.com
   - Password: TestPass123!
3. Click "Sign In"

**Expected**:
- ✅ Success message "Welcome back!"
- ✅ Redirected to /dashboard

### Test 3: Database Writes

In Supabase → Table Editor → profiles:

**Expected**:
- ✅ Row exists with test user email
- ✅ `user_type` = 'entrepreneur'
- ✅ `full_name` = 'Test User'
- ✅ `is_verified` = false
- ✅ `is_active` = true
- ✅ `created_at` has timestamp

---

## 🔒 Security Verification

### Check 1: RLS Enabled

In Supabase → Database → Policies:

**Expected**:
- ✅ `profiles` table has RLS enabled
- ✅ Policies exist: "Profiles are viewable by everyone", "Users can update own profile"
- ✅ All other tables have RLS enabled

### Check 2: Environment Variables

Check `.env.local` file exists and has:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Security**:
- ✅ `.env.local` is in `.gitignore`
- ✅ Keys are NOT committed to git
- ✅ Service role key is secret (never exposed to browser)

---

## 📱 PWA Verification

### Install App (Chrome Desktop)

1. Go to http://localhost:3500
2. Look for install icon in address bar (⊕ or +)
3. Click "Install AfroConnect"

**Expected**:
- ✅ App installs like native app
- ✅ Opens in standalone window (no browser chrome)
- ✅ AfroConnect icon in taskbar/dock

### Install App (Chrome Mobile)

1. Open http://localhost:3500 on phone
2. Tap browser menu (⋮) → "Add to Home Screen"

**Expected**:
- ✅ Icon appears on home screen
- ✅ Tapping opens as app (not browser tab)

**Note**: Icons must be generated first (see SETUP-GUIDE.md)

---

## 🚨 Common Issues & Fixes

### Issue: npm install fails

**Fix**:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Issue: Port 3500 in use

**Fix**: Edit `package.json`:
```json
"dev": "next dev -p 3600"
```

### Issue: "Supabase error: Invalid API key"

**Fix**:
- Check `.env.local` exists
- Verify keys are correct from Supabase dashboard
- Restart dev server: `npm run dev`

### Issue: Registration doesn't create user

**Fix**:
- Run `supabase-schema.sql` in Supabase SQL Editor
- Check Supabase logs for errors
- Verify RLS policies are applied

### Issue: CSS not loading / styles broken

**Fix**:
```bash
rm -rf .next
npm run dev
```

### Issue: TypeScript errors

**Fix**:
```bash
npm run type-check
```

---

## ✅ Final Checklist

Before marking as complete:

- [ ] All files from project structure exist
- [ ] `npm install` completed successfully
- [ ] Dev server runs without errors
- [ ] Homepage loads correctly
- [ ] Registration flow loads (both steps)
- [ ] Login page loads
- [ ] Responsive on mobile/desktop
- [ ] All documentation files present
- [ ] Database schema file exists and is valid
- [ ] PWA manifest exists
- [ ] `.gitignore` includes `.env.local`

**Optional (requires Supabase setup)**:
- [ ] Supabase project created
- [ ] Database schema applied
- [ ] Storage buckets created
- [ ] Test account registration works
- [ ] Test login works
- [ ] User data appears in database

---

## 🎉 Success Criteria

**Phase 1 is complete when**:

✅ All items in "Final Checklist" are checked  
✅ Dev server runs without errors  
✅ Homepage displays correctly  
✅ Registration/login flows are functional  
✅ Documentation is complete  
✅ Database schema is valid  

---

**Last Updated**: August 4, 2026  
**Status**: ✅ All Phase 1 deliverables complete
