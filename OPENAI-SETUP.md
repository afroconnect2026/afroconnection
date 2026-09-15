# OpenAI Setup Guide
**AfroConnect AI Features powered by OpenAI GPT-4o-mini**

## 🎉 Why OpenAI?

- ✅ **Industry Standard** - Most reliable AI API
- ✅ **Fast & Smart** - GPT-4o-mini is lightning fast
- ✅ **Affordable** - $0.15 per 1M input tokens
- ✅ **High Quality** - Best-in-class responses
- ✅ **Easy Setup** - 2 minutes!

---

## 🔑 Setup (2 Minutes)

### Step 1: Get API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "+ Create new secret key"
4. Name it "AfroConnect"
5. Copy the key (starts with `sk-proj-...`)

**Important**: Save the key - you won't see it again!

### Step 2: Add Credits (Optional)

OpenAI requires a small prepaid balance:
1. Go to: https://platform.openai.com/settings/organization/billing/overview
2. Add $5-$10 (will last months!)
3. For 1000 users = ~$2-5/month

**Cost Example**:
- 10,000 bio enhancements = ~$0.50
- 20,000 opportunity matches = ~$1.00
- Total: **Very cheap!**

### Step 3: Add to Environment

Edit `.env.local`:
```bash
OPENAI_API_KEY=sk-proj-YourActualKeyHere
```

### Step 4: Restart Server

```bash
npm run dev
```

**Done!** AI features are now active! 🚀

---

## 💰 Pricing

### GPT-4o-mini (What We Use):
- **Input**: $0.15 per 1M tokens (~$0.0001 per request)
- **Output**: $0.60 per 1M tokens (~$0.0002 per request)

### Monthly Estimate (1000 active users):
- Bio enhancements: 2,000 requests = **$0.60**
- Opportunity matches: 5,000 requests = **$1.50**
- **Total**: ~**$2-3/month**

Super affordable! 💪

---

## ✨ Features

1. **AI Bio Generator** - Profile page
   - Professional bio enhancement
   - 2-3 sentences, compelling
   - Personalized to user type
   
2. **Smart Opportunity Matching** - Opportunities page
   - Match score 0-100%
   - Detailed reasons
   - Missing skills analysis
   - Recommendations

---

## 🔧 Technical Details

### Model: GPT-4o-mini
- Fast inference (< 2 seconds)
- High-quality output
- Cost-effective
- Perfect for production

### Files:
- `lib/ai/openai.ts` (AI helper)
- `app/api/ai/generate-bio/route.ts`
- `app/api/ai/analyze-opportunity/route.ts`
- `.env.local` (OPENAI_API_KEY)

---

## 🐛 Troubleshooting

### Error: "AI service not configured"
**Fix**: 
- Add OPENAI_API_KEY to `.env.local`
- Restart server: `npm run dev`

### Error: "Insufficient credits"
**Fix**:
- Add credits at: https://platform.openai.com/settings/organization/billing/overview
- Minimum: $5

### Error: "Invalid API key"
**Fix**:
- Check key starts with `sk-proj-` or `sk-`
- No extra spaces
- Create new key if needed

### Error: "Rate limit exceeded"
**Fix**:
- Free tier: 3 requests/min
- Paid tier: Much higher limits
- Wait and retry

---

## 🎯 Free Credits

New OpenAI accounts get **$5 free credits**!
- Valid for 3 months
- Enough for testing
- Perfect to start!

---

## 🎉 Ready!

Your AI features are now powered by OpenAI!

**Next Steps**:
1. Get API key: https://platform.openai.com/api-keys
2. Add it to `.env.local`
3. Restart server
4. Test features!

**High quality AI at low cost!** 🚀
