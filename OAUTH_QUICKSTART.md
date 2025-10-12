# Google OAuth Quickstart Guide

**⏱️ Time**: 15-20 minutes
**📖 Full Guide**: `CONFIGURE_OAUTH_NOW.md`

---

## 🚀 Ultra-Quick Start (Copy & Paste)

### Your Supabase Project Info

```
Project: Ottopen
Project ID: wkvatudgffosjfwqyxgt
Region: us-east-2
```

### Critical URLs You'll Need

**Supabase OAuth Callback URL** (paste this in Google Console):

```
https://wkvatudgffosjfwqyxgt.supabase.co/auth/v1/callback
```

**Authorized JavaScript Origins** (paste in Google Console):

```
http://localhost:3000
https://wkvatudgffosjfwqyxgt.supabase.co
```

---

## ✅ 3-Step Setup

### Step 1: Google Cloud Console (10 min)

1. **Go to**: https://console.cloud.google.com/
2. **Create project** named "Ottopen"
3. **Enable Google+ API**: Search in API Library
4. **OAuth Consent Screen**:
   - Choose "External"
   - App name: `Ottopen`
   - Email: Your email
   - Add scopes: email, profile, openid
   - Add test user: Your email
5. **Create OAuth Client**:
   - Type: Web application
   - Name: `Ottopen Web Client`
   - JavaScript origins: `http://localhost:3000`
   - Redirect URIs: `https://wkvatudgffosjfwqyxgt.supabase.co/auth/v1/callback`
6. **Copy credentials**:
   - Client ID
   - Client Secret

### Step 2: Supabase Dashboard (5 min)

1. **Go to**: https://app.supabase.com/
2. **Open project**: Ottopen
3. **Go to**: Authentication → Providers
4. **Enable Google**:
   - Paste Client ID
   - Paste Client Secret
   - Save
5. **Set Site URL**: Authentication → URL Configuration
   - Site URL: `http://localhost:3000`
   - Save

### Step 3: Test It (5 min)

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000/auth/signin

# Click "Sign in with Google"
# → Should work! ✨
```

---

## 🔍 Quick Troubleshooting

**Error: redirect_uri_mismatch**
→ Check Google Console redirect URI is EXACTLY: `https://wkvatudgffosjfwqyxgt.supabase.co/auth/v1/callback`

**Button doesn't work**
→ Check Supabase Provider settings have Client ID and Secret

**Access blocked**
→ Add your email as test user in Google OAuth Consent Screen

---

## 📚 Detailed Guides

- **Step-by-step with screenshots**: `CONFIGURE_OAUTH_NOW.md`
- **Implementation details**: `GOOGLE_OAUTH_SETUP.md`
- **Testing guide**: `START_TESTING_NOW.md`

---

**Ready?** Open `CONFIGURE_OAUTH_NOW.md` and follow Step 1!
