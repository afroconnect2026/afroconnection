# AI Features Testing Guide
**Quick guide to test your FREE AI features**

## ✅ Before Testing

1. **Server running?** Check: http://localhost:3500
2. **Logged in?** You need an account to test

---

## 🧪 Test #1: AI Bio Generator

### Step-by-Step:

1. Go to: **http://localhost:3500/profile**
2. Click the **"Edit"** button (top right)
3. Scroll to **"Bio"** field
4. Type something simple:
   ```
   I am a software developer
   ```
5. Click **"✨ Enhance Bio with AI"** button
6. **Wait 2-3 seconds**
7. **Result**: AI shows enhanced bio in a purple box!
8. Click **"Use This Bio"** to accept
9. Click **"Save Changes"**

### What Should Happen:
- ✅ Purple preview box appears with enhanced bio
- ✅ Enhanced bio is professional and longer
- ✅ You can accept or reject it

### If It Doesn't Work:
- ❌ No button visible → Server not restarted
- ❌ Error "AI service not configured" → API key issue
- ❌ Loading forever → Check browser console (F12)

---

## 🧪 Test #2: Opportunity Matching

### Step-by-Step:

1. Go to: **http://localhost:3500/opportunities**
2. Find any opportunity card
3. Look for **"✨ AI Match"** link (small, below description)
4. Click it
5. **Wait 2-3 seconds**
6. **Result**: Match score appears (e.g., "85% Match")
7. Click the score badge to expand details

### What Should Happen:
- ✅ Match score shows (0-100%)
- ✅ Color-coded badge (green=good, yellow=fair, etc.)
- ✅ Clicking expands to show reasons and missing skills

### If It Doesn't Work:
- ❌ No "AI Match" link → Check you're logged in
- ❌ Error message → Check console (F12)
- ❌ Loading forever → API key or network issue

---

## 🔧 Troubleshooting

### Problem: "AI service not configured"
**Fix**: 
1. Check `.env.local` has `GOOGLE_GEMINI_API_KEY=AQ...`
2. Restart server: Stop (Ctrl+C) → `npm run dev`

### Problem: No AI buttons visible
**Fix**:
1. Hard refresh: Ctrl+Shift+R
2. Clear cache
3. Restart server

### Problem: Features there but not working
**Fix**:
1. Open browser console (F12)
2. Look for red errors
3. Check Network tab for failed requests
4. Tell me the error message!

---

## 📍 Exact Locations

### Bio Generator:
**File**: `app/profile/page.tsx`
**Line**: ~470 (in edit mode, under bio textarea)

### Opportunity Match:
**File**: `app/opportunities/page.tsx`
**Line**: ~430 (inside opportunity card)

---

## ✅ Success Checklist

- [ ] Server running on http://localhost:3500
- [ ] Logged in with account
- [ ] "✨ Enhance Bio with AI" button visible on /profile (edit mode)
- [ ] "✨ AI Match" link visible on /opportunities cards
- [ ] Bio generator works (shows enhanced bio)
- [ ] Opportunity matching works (shows score)

---

## 🆘 Still Not Working?

1. **Screenshot** what you see
2. **Copy** any error messages from console (F12)
3. **Tell me** which feature and what happens
4. I'll help you fix it!

---

**Your AI features are 100% FREE and ready to use!** 🎉
