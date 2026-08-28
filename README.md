# AfroConnect

**Connecting Africa to Opportunity**

A professional networking platform for African entrepreneurs, investors, diaspora professionals, and business opportunities across borders.

---

## 🌍 Overview

AfroConnect is a Progressive Web App (PWA) that serves as a trust bridge for:

- **Entrepreneurs** seeking co-founders, investors, mentors, and funding
- **Investors** looking for high-potential African startups and opportunities
- **Professionals** seeking career opportunities, networking, and consulting gigs
- **Companies** recruiting talent, finding partners, and expanding across Africa
- **African Diaspora** connecting back to invest and build in Africa

---

## ✨ Features

### Phase 1 (Current - MVP)
- ✅ **Progressive Web App** - Installable, offline-capable, app-like experience
- ✅ **Multi-user Types** - Entrepreneur, Investor, Professional, Company profiles
- ✅ **Smart Registration** - Two-step onboarding with user type selection
- ✅ **Supabase Backend** - PostgreSQL database, Auth, Storage
- ✅ **Beautiful UI** - Tailwind CSS with AfroConnect brand colors (Green, Gold, Navy)
- ✅ **Responsive Design** - Mobile-first, works on all devices
- ✅ **Authentication** - Email/password + Google OAuth ready
- ✅ **Profile System** - Separate profile tables for each user type

### Phase 2 (Roadmap)
- 🔄 **AI-Powered Matching** - Smart co-founder, investor, mentor matching
- 🔄 **Opportunity Feed** - Personalized jobs, investments, partnerships
- 🔄 **Messaging System** - Real-time conversations between users
- 🔄 **Profile Optimization** - AI suggestions to improve profiles
- 🔄 **Content Generation** - AI helps write bios, pitches, descriptions
- 🔄 **Business Pitch Portal** - Upload pitch decks, business plans
- 🔄 **Mentorship Booking** - Schedule sessions with mentors
- 🔄 **Career Center** - Job postings, CV uploads, applications

### Phase 3 (Long-term Vision)
- 🎯 **Investment Opportunity Hub** - Market reports, government incentives
- 🎯 **Payment Integration** - Online payments, subscription tiers
- 🎯 **CRM/Email Marketing** - Automated outreach, campaigns
- 🎯 **Analytics Dashboard** - Platform-wide insights
- 🎯 **Mobile Apps** - Native iOS/Android apps

---

## 🚀 Tech Stack

- **Framework**: Next.js 14 (React, TypeScript)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **PWA**: next-pwa, Service Workers
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Notifications**: React Hot Toast
- **AI**: OpenAI API (for matching, recommendations, content generation)

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- OpenAI API key (for AI features)

### 1. Clone & Install

```bash
cd C:/Users/Admin/afroconnect
npm install
```

### 2. Setup Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. In Supabase Dashboard → SQL Editor, run `supabase-schema.sql`
3. In Supabase Dashboard → Storage, create buckets:
   - `avatars` (public)
   - `company-logos` (public)
   - `documents` (private)
4. Get your project URL and anon key from Settings → API

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
NEXT_PUBLIC_APP_URL=http://localhost:3500
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3500](http://localhost:3500)

---

## 🏗️ Project Structure

```
afroconnect/
├── app/                      # Next.js app directory
│   ├── auth/                 # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/            # User dashboard
│   ├── explore/              # Explore users & opportunities
│   ├── messages/             # Messaging system
│   ├── opportunities/        # Opportunity listings
│   ├── profile/              # User profile pages
│   ├── settings/             # Account settings
│   ├── api/                  # API routes
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Homepage
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── ui/                   # Reusable UI components
│   ├── layout/               # Layout components
│   └── features/             # Feature-specific components
├── lib/                      # Utility libraries
│   ├── supabase/             # Supabase client & server
│   ├── ai/                   # AI/OpenAI utilities
│   └── utils/                # Helper functions
├── types/                    # TypeScript types
│   └── database.ts           # Database types
├── public/                   # Static assets
│   ├── icons/                # PWA icons
│   ├── images/               # Images
│   └── manifest.json         # PWA manifest
├── supabase-schema.sql       # Database schema
├── next.config.js            # Next.js + PWA config
├── tailwind.config.js        # Tailwind config
└── package.json              # Dependencies
```

---

## 🎨 Brand Colors

```css
Primary Green: #008000
Gold: #FFC300
Navy Blue: #001F3F
White: #FFFFFF
```

---

## 🔐 Supabase RLS Policies

All tables have Row-Level Security enabled:

- **Profiles**: Everyone can read, users can update their own
- **Opportunities**: Everyone can see active ones, creators manage their own
- **Matches**: Users see only their own matches
- **Messages**: Users see only their conversations

---

## 📱 PWA Features

- ✅ Installable on mobile (Add to Home Screen)
- ✅ Offline capability (service worker caching)
- ✅ App-like experience (no browser chrome)
- ✅ Push notifications ready (Phase 2)
- ✅ Responsive icons (72px to 512px)
- ✅ Shortcuts for quick actions

---

## 🤖 AI Features (Phase 2)

The platform will use OpenAI to:

1. **Smart Matching**: Analyze profiles and suggest compatible co-founders, investors, mentors
2. **Profile Optimization**: Give suggestions to improve profiles (add skills, better bio, etc)
3. **Opportunity Recommendations**: Personalized feed based on user preferences
4. **Content Generation**: Help users write compelling bios, pitches, descriptions

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Build for Production

```bash
npm run build
npm start
```

---

## 📝 TODO / Roadmap

### Immediate (Phase 1 Polish)
- [ ] Add email verification flow
- [ ] Add forgot password flow
- [ ] Create onboarding wizard after registration
- [ ] Build explore page with user directory
- [ ] Add search and filters
- [ ] Create user profile pages
- [ ] Add avatar upload

### Phase 2
- [ ] Implement AI matching algorithm
- [ ] Build messaging system
- [ ] Create opportunity posting flow
- [ ] Add mentorship booking
- [ ] Implement push notifications
- [ ] Build admin dashboard

### Phase 3
- [ ] Payment integration
- [ ] CRM/email campaigns
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

This is a private project. For questions or support, contact the development team.

---

## 📄 License

Copyright © 2026 AfroConnect. All rights reserved.

---

## 🔗 Links

- **Production**: TBD
- **Staging**: TBD
- **Supabase Dashboard**: [Your Supabase Project](https://supabase.com/dashboard)

---

## 🆘 Support

For technical issues:
1. Check Supabase logs in Dashboard → Logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Ensure Supabase schema is applied

---

**Built with ❤️ by Netsofty** | [www.netsofty.com](https://www.netsofty.com)
