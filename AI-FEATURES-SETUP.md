# AI Features Setup Guide - Phase 1
**Date**: September 7, 2026  
**Features**: AI Profile Bio Generator + Smart Opportunity Matching

---

## 🎯 What's Included

### 1. AI Profile Bio Generator ✨
- Enhances user bios to be more professional and compelling
- Located in profile edit page
- Uses Anthropic Claude Sonnet 4 for natural language enhancement
- One-click enhancement with preview and accept/reject

### 2. Smart Opportunity Matching 🎯
- AI-powered match scoring for opportunities
- Shows % match, reasons, and missing skills
- Helps users find relevant opportunities faster
- Located on opportunities page

---

## 📦 Installation Complete

✅ Anthropic SDK installed  
✅ API routes created  
✅ UI components built  
✅ Integrated into profile and opportunities pages  
✅ Build successful (no TypeScript errors)

---

## 🔑 Setup Required

### Step 1: Get Your Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create Key"
5. Copy your API key

### Step 2: Add API Key to Environment

1. Open `.env.local` in your project root (create if doesn't exist)
2. Add this line:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```
3. Replace `sk-ant-api03-your-actual-key-here` with your actual key
4. Save the file

**IMPORTANT**: 
- Never commit `.env.local` to git
- Keep your API key secret
- The key should start with `sk-ant-api03-`

### Step 3: Restart Development Server

```bash
# Stop the dev server (Ctrl+C)
npm run dev
# Server will load the new environment variable
```

---

## 🚀 How to Use

### AI Bio Generator (Profile Page)

1. Go to **Profile** → Click **Edit** button
2. Write or paste your current bio (min 10 characters)
3. Click **"✨ Enhance Bio with AI"** button
4. Wait a few seconds for AI to generate enhanced version
5. Review the AI-enhanced bio
6. Click **"Use This Bio"** to accept, or **"Cancel"** to reject
7. Click **"Save Changes"** to save your profile

**Tips**:
- The more details you provide, the better the AI enhancement
- Works for all user types: entrepreneur, investor, professional, company
- Generated bios are 2-3 sentences, ~150 words max

### Smart Opportunity Matching (Opportunities Page)

1. Go to **Opportunities** page
2. Browse opportunities
3. Click **"✨ AI Match"** on any opportunity card
4. AI analyzes your profile vs opportunity requirements
5. See match score (0-100%), reasons, and missing skills
6. Click the score badge to expand full analysis

**Match Levels**:
- 🟢 80-100%: Excellent Match
- 🔵 60-79%: Good Match  
- 🟡 40-59%: Fair Match
- ⚫ 0-39%: Low Match

---

## 💰 Cost Estimation

**Anthropic Claude Pricing**:
- ~$0.003 per API call for bio generation
- ~$0.005 per API call for opportunity matching

**Estimated Monthly Cost** (1000 active users):
- Bio generations: ~50 per month = $0.15
- Opportunity matches: ~500 per month = $2.50
- **Total: ~$3/month for 1000 users**

**Free Tier**:
- Anthropic offers $5 free credits for new accounts
- Good for ~1,000 AI requests

---

## 🔧 Technical Details

### API Routes

**1. Generate Bio**
```
POST /api/ai/generate-bio
Body: {
  currentBio: string,
  userType: string,
  industry?: string,
  skills?: string[],
  experience?: string
}
Response: {
  success: true,
  enhancedBio: string,
  originalLength: number,
  enhancedLength: number
}
```

**2. Analyze Opportunity Match**
```
POST /api/ai/analyze-opportunity
Body: {
  opportunityId: string
}
Response: {
  success: true,
  score: number (0-100),
  reasons: string[],
  missingSkills: string[],
  recommendation: string
}
```

### Components

**BioGenerator** (`components/ai/BioGenerator.tsx`):
- Props: currentBio, userType, industry, onBioGenerated
- Handles API calls, loading states, preview UI
- Animated preview with Framer Motion

**OpportunityMatchBadge** (`components/ai/OpportunityMatchBadge.tsx`):
- Props: opportunityId, compact (optional)
- Fetches user profile and opportunity data
- Displays match score with expandable details
- Color-coded by match level

### Helper Functions

**`lib/ai/anthropic.ts`**:
- `generateEnhancedBio()` - Enhances user bios
- `analyzeOpportunityMatch()` - Analyzes user-opportunity fit
- `generateConversationStarters()` - For Phase 2 (Dealroom AI)

---

## 🐛 Troubleshooting

### Error: "AI service not configured"
**Cause**: ANTHROPIC_API_KEY not set  
**Fix**: Add API key to `.env.local` and restart server

### Error: "Failed to generate bio"
**Possible causes**:
1. Invalid API key → Check key format
2. Rate limit exceeded → Wait a few minutes
3. Bio too short → Write at least 10 characters
4. Network issue → Check internet connection

### AI Match not showing
**Cause**: User not authenticated  
**Fix**: Ensure user is logged in

### Build errors
**Cause**: Missing imports  
**Fix**: Run `npm install @anthropic-ai/sdk`

---

## 📊 Monitoring & Limits

### Rate Limiting (Recommended)

Add rate limiting in production:
```typescript
// Per user limits
- Bio generation: 10 per day
- Opportunity matching: 50 per day
```

### Error Tracking

All AI calls have try-catch error handling:
- Errors logged to console
- User-friendly toast notifications
- Fallback responses if AI fails

### API Key Security

✅ API key stored in environment variable  
✅ Only used server-side (API routes)  
✅ Never exposed to client  
✅ Validated before use

---

## 🚀 Next Steps (Phase 2)

Ready to add more AI features? Next phase includes:

1. **AI Dealroom Assistant** 💬
   - Conversation starters
   - Message translation
   - Meeting summaries

2. **Smart Connection Recommendations** 🤝
   - AI-matched networking suggestions
   - "People you should connect with"
   - Relevance scoring

3. **Content Moderation** 🛡️
   - AI spam detection
   - Fake profile flagging
   - Inappropriate content filter

**Estimated time**: 2-3 weeks for Phase 2

---

## 📝 Files Created/Modified

### New Files:
- `.env.example` - Environment variables template
- `lib/ai/anthropic.ts` - AI helper functions
- `app/api/ai/generate-bio/route.ts` - Bio generation API
- `app/api/ai/analyze-opportunity/route.ts` - Match analysis API
- `components/ai/BioGenerator.tsx` - Bio generator UI
- `components/ai/OpportunityMatchBadge.tsx` - Match badge UI
- `AI-FEATURES-SETUP.md` - This guide

### Modified Files:
- `app/profile/page.tsx` - Added BioGenerator component
- `app/opportunities/page.tsx` - Added OpportunityMatchBadge
- `package.json` - Added @anthropic-ai/sdk dependency

---

## ✅ Testing Checklist

Before going live:

- [ ] Add ANTHROPIC_API_KEY to `.env.local`
- [ ] Restart development server
- [ ] Test bio generation with different user types
- [ ] Test opportunity matching with various profiles
- [ ] Verify error handling (invalid API key, network errors)
- [ ] Check mobile responsiveness
- [ ] Monitor API costs in Anthropic console
- [ ] Set up rate limiting in production

---

## 🎉 You're All Set!

Your AI features are ready to use. Users can now:
1. ✨ Enhance their bios with AI
2. 🎯 Get smart opportunity match scores
3. 💡 Make better decisions with AI insights

**Need help?** Check the troubleshooting section or review the code in:
- `lib/ai/anthropic.ts` for AI logic
- API route files for backend implementation
- Component files for UI details

Happy networking! 🚀
