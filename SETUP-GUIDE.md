# AfroConnect Setup Guide

Complete step-by-step guide to get AfroConnect running locally and deploy to production.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18 or higher installed ([Download](https://nodejs.org))
- [ ] npm or yarn package manager
- [ ] Supabase account ([Sign up free](https://supabase.com))
- [ ] OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- [ ] Text editor (VS Code recommended)
- [ ] Git installed (optional, for version control)

---

## 🛠️ Step 1: Install Dependencies

Open terminal in `C:/Users/Admin/afroconnect/` and run:

```bash
npm install
```

This will install:
- Next.js 14
- React 18
- Tailwind CSS
- Supabase client
- Framer Motion
- All other dependencies

**Expected duration**: 2-3 minutes

---

## 🗄️ Step 2: Setup Supabase Database

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Organization**: Create new or select existing
   - **Name**: `afroconnect` (or your choice)
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users (e.g., Africa/Europe)
4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

### 2.2 Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy ENTIRE contents of `supabase-schema.sql` from this project
4. Paste into SQL editor
5. Click "Run" (bottom right)
6. Wait for "Success. No rows returned" message

This creates:
- ✅ All database tables (profiles, opportunities, matches, messages)
- ✅ Indexes for performance
- ✅ Row-Level Security policies
- ✅ Automatic timestamp triggers

### 2.3 Create Storage Buckets

1. In Supabase Dashboard, go to **Storage**
2. Click "New bucket"
3. Create these buc3 buckets:

   **Bucket 1: avatars**
   - Name: `avatars`
   - Public bucket: ✅ Yes
   - Click "Create bucket"

   **Bucket 2: company-logos**
   - Name: `company-logos`
   - Public bucket: ✅ Yes
   - Click "Create bucket"

   **Bucket 3: documents**
   - Name: `documents`
   - Public bucket: ❌ No (private)
   - Click "Create bucket"

### 2.4 Get API Keys

1. In Supabase Dashboard, go to **Settings → API**
2. Copy these values (you'll need them next):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long JWT token)
   - **service_role key**: `eyJhbGc...` (long JWT token, keep secret!)

---

## 🔑 Step 3: Configure Environment Variables

1. In project root, copy the example file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` in your text editor

3. Fill in your credentials:

   ```env
   # From Supabase Settings → API
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # From OpenAI Platform
   OPENAI_API_KEY=sk-proj-...

   # App URL (keep as-is for local dev)
   NEXT_PUBLIC_APP_URL=http://localhost:3500
   NEXT_PUBLIC_APP_NAME=AfroConnect
   ```

4. Save the file

⚠️ **IMPORTANT**: Never commit `.env.local` to git! It's in `.gitignore` by default.

---

## 🎨 Step 4: Add PWA Icons

The app needs icons for the Progressive Web App. You have 2 options:

### Option A: Use Placeholder Icons (Quick Start)

We'll create simple colored circles as placeholder icons:

1. Go to [favicon.io](https://favicon.io/favicon-generator/)
2. Generate icons with:
   - Text: **AC** (AfroConnect)
   - Background: **#008000** (green)
   - Font: **Poppins Bold**
3. Download the generated icons
4. Extract and copy these files to `public/icons/`:
   - Rename files to match manifest (icon-72x72.png, icon-96x96.png, etc.)

### Option B: Use Professional Logo (Recommended for Production)

1. Get the AfroConnect logo from the proposal PDF
2. Use [realfavicongenerator.net](https://realfavicongenerator.net) to generate all sizes
3. Download and extract to `public/icons/`

**Required icon sizes**:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

---

## 🚀 Step 5: Run Development Server

```bash
npm run dev
```

You should see:

```
ready - started server on 0.0.0.0:3500, url: http://localhost:3500
```

Open [http://localhost:3500](http://localhost:3500) in your browser.

### What You Should See

✅ **Homepage**: Beautiful gradient hero with AfroConnect branding  
✅ **Sign Up button**: Clicking opens registration flow  
✅ **Sign In button**: Opens login page  
✅ **No errors** in browser console

---

## 🧪 Step 6: Test the App

### 6.1 Create Test Account

1. Click "Get Started" or "Sign Up"
2. Choose user type: **Entrepreneur**
3. Fill in:
   - Full Name: `Test User`
   - Email: `test@afroconnect.com`
   - Password: `TestPass123!`
4. Click "Create Account"

### 6.2 Verify in Supabase

1. Go to Supabase Dashboard → **Authentication → Users**
2. You should see your test user
3. Go to **Table Editor → profiles**
4. You should see a row with your user data

### 6.3 Test Login

1. Go to `/auth/login`
2. Enter test credentials
3. Click "Sign In"
4. You should be redirected to `/dashboard` (will be built in Phase 2)

---

## 🐛 Troubleshooting

### Issue: "Supabase error: Invalid API key"

**Fix**: Check your `.env.local` file has the correct `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue: "Database error: relation 'profiles' does not exist"

**Fix**: Run `supabase-schema.sql` in Supabase SQL Editor again

### Issue: Port 3500 already in use

**Fix**: Change port in `package.json`:
```json
"dev": "next dev -p 3600"
```

### Issue: Icons not loading / PWA not installing

**Fix**: Ensure all 8 icon files exist in `public/icons/` folder

### Issue: "OpenAI API error"

**Fix**: 
- Check `OPENAI_API_KEY` in `.env.local`
- Verify key is valid at [platform.openai.com](https://platform.openai.com)
- Note: AI features are Phase 2, app works without OpenAI for now

---

## 📦 Step 7: Build for Production

When ready to deploy:

```bash
npm run build
```

This will:
- ✅ Compile TypeScript
- ✅ Optimize images
- ✅ Generate service worker (PWA)
- ✅ Bundle and minify code

Expected output:
```
Route (app)                  Size     First Load JS
┌ ○ /                        5.2 kB          120 kB
├ ○ /auth/login              3.8 kB          118 kB
└ ○ /auth/register           4.5 kB          119 kB
```

Test production build locally:

```bash
npm start
```

---

## 🌐 Step 8: Deploy to Production

### Deploy to Vercel (Recommended - Free for PWAs)

1. Push code to GitHub:

   ```bash
   git init
   git add .
   git commit -m "Initial AfroConnect setup"
   git remote add origin https://github.com/YOUR-USERNAME/afroconnect.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. In "Environment Variables", add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel URL)
6. Click "Deploy"
7. Wait 2-3 minutes
8. Visit your live site at `https://afroconnect.vercel.app`

### Update Supabase Auth Settings

1. In Supabase Dashboard → **Authentication → URL Configuration**
2. Add your production URL:
   - Site URL: `https://afroconnect.vercel.app`
   - Redirect URLs: `https://afroconnect.vercel.app/**`

---

## ✅ Setup Complete!

Your AfroConnect platform is now running! 🎉

### Next Steps:

1. **Customize branding**: Update colors, logo, copy
2. **Test all flows**: Registration, login, profile
3. **Add content**: Create test profiles, opportunities
4. **Phase 2 features**: Start building AI matching, messaging
5. **Get feedback**: Share with Biar Kon for review

---

## 📞 Need Help?

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

---

**Happy building!** 🚀

Built by **Netsofty** | [www.netsofty.com](https://www.netsofty.com)
