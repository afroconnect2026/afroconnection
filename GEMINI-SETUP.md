# Google Gemini AI Setup - 100% FREE!
**AfroConnect AI Features powered by Google Gemini**

## 🎉 What Changed?

Switched from Anthropic Claude (paid) to **Google Gemini (FREE!)** 

### Why Gemini?
- ✅ **100% FREE** - No credit card required!
- ✅ **60 requests/minute, 1,500/day** - Forever!
- ✅ **Fast** - 1-3 second responses
- ✅ **Reliable** - Made by Google
- ✅ **Great quality** - Gemini 1.5 Flash

---

## 🔑 Setup (5 Minutes)

### Step 1: Get FREE API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with any Google account
3. Click "Create API key in new project"
4. Copy your key (starts with `AIza...`)

**No credit card needed!** ✅

### Step 2: Add to Environment

Edit `.env.local`:
```bash
GOOGLE_GEMINI_API_KEY=AIzaYourActualKeyHere
```

### Step 3: Restart Server

```bash
npm run dev
```

**Done!** AI features are now active! 🚀

---

## 💰 Cost: $0.00 Forever!

- **Free Tier**: 60 requests/min, 1,500/day
- **For 1000 users**: ~10,000 requests/month
- **Cost**: **$0.00** (within free limits!)

---

## ✨ Features

Same amazing features, now FREE:

1. **AI Bio Generator** - Profile page
2. **Smart Opportunity Matching** - Opportunities page

---

## 🔧 Technical Details

### Model: Gemini 1.5 Flash
- Fast & Free
- High quality output
- Perfect for real-time features

### Files Changed:
- `lib/ai/gemini.ts` (new - replaces anthropic.ts)
- `app/api/ai/*.ts` (updated imports)
- `.env.example` (updated variable name)

---

## 🐛 Troubleshooting

**Error: "AI service not configured"**
- Add GOOGLE_GEMINI_API_KEY to .env.local
- Restart dev server

**Error: "Rate limit"**
- Wait 1 minute (60 req/min limit)
- Normal for free tier

---

## 🎉 Ready!

Your AI features are now **100% FREE** with Google Gemini!

Get your key: https://aistudio.google.com/app/apikey
