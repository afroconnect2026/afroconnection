# Deploy AfroConnect to Vercel

## Quick Deployment Guide

### Prerequisites
- ✅ GitHub repository (done!)
- ✅ Supabase project with database setup
- ✅ Vercel account (free tier available)

---

## Method 1: Vercel Dashboard (Recommended)

### Step 1: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Authorize Vercel to access your repositories

### Step 2: Import Project
1. Click **Add New... → Project**
2. Select **afroconnection** from your GitHub repos
3. Click **Import**

### Step 3: Configure Build Settings
Vercel auto-detects Next.js settings:
- **Framework Preset:** Next.js ✅
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Development Command:** `npm run dev`

**No changes needed - defaults are perfect!**

### Step 4: Environment Variables ⚠️ CRITICAL

Add these environment variables in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to get your Supabase credentials:**
1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon)
3. Click **API** in the sidebar
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 5: Deploy
1. Click **Deploy**
2. Wait 2-3 minutes for build
3. Your app will be live at `https://your-project.vercel.app`

---

## Method 2: Vercel CLI

### Install Vercel CLI
```bash
npm install -g vercel
```

### Deploy
```bash
cd C:\Users\Admin\afroconnect
vercel login
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N**
- Project name? **afroconnection**
- Directory? **./
- Override settings? **N**

### Add Environment Variables
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Deploy to Production
```bash
vercel --prod
```

---

## Post-Deployment Setup

### 1. Configure Supabase URL
Add your Vercel domain to Supabase allowed domains:
1. Supabase Dashboard → Authentication → URL Configuration
2. Add to **Site URL**: `https://your-project.vercel.app`
3. Add to **Redirect URLs**: `https://your-project.vercel.app/**`

### 2. Update CORS (if needed)
Your Supabase project should already allow your Vercel domain.

### 3. Test Your Deployment
- ✅ Landing page loads
- ✅ Events and opportunities display
- ✅ Sign up / login works
- ✅ Create event works
- ✅ RSVP works
- ✅ Images load (from Supabase Storage)

---

## Automatic Deployments

**Every git push to main triggers auto-deployment!**

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically:
# 1. Detects the push
# 2. Builds your app
# 3. Deploys to production
# 4. Updates your live URL
```

---

## Environment Variables Reference

### Required Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Optional Variables (for future)
```
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_PAYMENTS=true

# API Keys (if you add payment processing later)
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

---

## Custom Domain Setup

### Add Your Own Domain
1. In Vercel dashboard → Settings → Domains
2. Add domain: `afroconnect.com`
3. Update DNS records as instructed
4. SSL certificate auto-provisioned ✅

**DNS Configuration:**
```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

---

## Build Optimization

### Already Optimized
✅ Image optimization (Next.js Image component)
✅ Code splitting
✅ Static optimization
✅ PWA service worker
✅ Minification

### Current Bundle Size
- **First Load JS:** 87.5 kB (shared)
- **Largest page:** 15 kB (excellent!)
- **Build time:** ~60 seconds

---

## Monitoring & Analytics

### Vercel Analytics (Free)
1. Enable in Vercel dashboard
2. Automatically tracks:
   - Page views
   - Performance metrics
   - Core Web Vitals
   - Real user monitoring

### Vercel Speed Insights (Free)
Add to your `layout.tsx`:
```tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
```

---

## Troubleshooting

### Build Fails
**Error: "Module not found"**
- Solution: Check `package.json` dependencies
- Run `npm install` locally first

**Error: "Environment variable not set"**
- Solution: Add all required env vars in Vercel dashboard

### 404 Errors
**Dynamic routes not working**
- Check file naming: `[id]` for dynamic params
- Verify `generateStaticParams` for static generation

### Database Connection Issues
**Error: "Failed to connect to Supabase"**
1. Verify environment variables are correct
2. Check Supabase project is not paused
3. Verify allowed domains in Supabase

### Images Not Loading
**Supabase Storage images 404**
1. Check bucket is public
2. Verify storage policies allow SELECT
3. Add Supabase domain to `next.config.js` images

---

## Vercel Pricing

### Free Tier (Hobby)
✅ 100 GB bandwidth/month
✅ Unlimited deployments
✅ Automatic HTTPS
✅ Edge Network
✅ Preview deployments
❌ Commercial use not allowed

### Pro Tier ($20/month)
✅ 1 TB bandwidth/month
✅ Commercial use allowed
✅ Analytics included
✅ Team collaboration
✅ Password protection
✅ Custom deployment regions

**Recommendation:**
- Start with **Free tier** for testing
- Upgrade to **Pro** before going commercial
- Consider **Hostinger VPS** ($6/month) for lower long-term cost

---

## Deployment Checklist

Before deploying:
- [x] Code pushed to GitHub
- [ ] Environment variables ready (Supabase URL & Key)
- [ ] Supabase database set up
- [ ] All SQL migrations run
- [ ] Security fixes applied
- [ ] Test build locally (`npm run build`)

During deployment:
- [ ] Import project in Vercel
- [ ] Add environment variables
- [ ] Click Deploy
- [ ] Wait for build (~2 min)

After deployment:
- [ ] Test landing page
- [ ] Test authentication
- [ ] Test event creation
- [ ] Test RSVP
- [ ] Configure custom domain (optional)
- [ ] Enable analytics (optional)

---

## Next Steps After Deployment

1. **Share the URL!**
   - Your app is live at `https://your-project.vercel.app`
   
2. **Monitor Performance**
   - Check Vercel Analytics dashboard
   - Monitor Core Web Vitals

3. **Gather Feedback**
   - Share with test users
   - Collect bug reports
   - Track usage patterns

4. **Iterate**
   - Fix bugs
   - Add features
   - Every push auto-deploys!

---

**Your AfroConnect platform will be live in 2 minutes! 🚀**
