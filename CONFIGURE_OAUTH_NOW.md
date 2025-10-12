# Configure Google OAuth NOW - Step-by-Step

**Time Required**: 15-20 minutes
**Prerequisites**: Google account, Admin access to Supabase

---

## 🔴 IMPORTANT: Configuration Order

You MUST complete these steps in order:

1. **Google Cloud Console** (Steps 1-4) - Get credentials first
2. **Supabase Dashboard** (Step 5) - Configure with Google credentials
3. **Test** (Step 6) - Verify it works

---

## Step 1: Create Google Cloud Project (3 minutes)

### 1.1 Go to Google Cloud Console

Open: https://console.cloud.google.com/

### 1.2 Create or Select Project

**Option A: Create New Project**

1. Click project dropdown (top left)
2. Click "New Project"
3. Enter project name: **Ottopen**
4. Click "Create"
5. Wait for project creation (30 seconds)
6. Select your new project

**Option B: Use Existing Project**

1. Click project dropdown (top left)
2. Select existing project

---

## Step 2: Enable Google+ API (2 minutes)

### 2.1 Navigate to APIs & Services

1. Click hamburger menu (☰) → **APIs & Services** → **Library**

### 2.2 Enable Google+ API

1. In search box, type: **Google+ API**
2. Click on **Google+ API** (by Google)
3. Click **Enable**
4. Wait for confirmation (10 seconds)

**Note**: If already enabled, you'll see "Manage" button - skip to next step

---

## Step 3: Configure OAuth Consent Screen (5 minutes)

### 3.1 Navigate to Consent Screen

1. Click hamburger menu (☰) → **APIs & Services** → **OAuth consent screen**

### 3.2 Choose User Type

1. Select **External** (unless you have Google Workspace)
2. Click **Create**

### 3.3 Fill OAuth Consent Screen - App Information

**App name**: `Ottopen`

**User support email**: `your-email@example.com` (your email)

**App logo**: (Optional - skip for now, add later)

**Application home page**: `http://localhost:3000`

- For production, change to: `https://your-domain.com`

**Application privacy policy link**: `http://localhost:3000/legal/privacy`

- For production: `https://your-domain.com/legal/privacy`

**Application terms of service link**: `http://localhost:3000/legal/terms`

- For production: `https://your-domain.com/legal/terms`

**Authorized domains**: (Leave blank for now)

**Developer contact information**: `your-email@example.com` (your email)

Click **Save and Continue**

### 3.4 Configure Scopes

1. Click **Add or Remove Scopes**
2. Scroll down and select these scopes:
   - ✅ `.../auth/userinfo.email`
   - ✅ `.../auth/userinfo.profile`
   - ✅ `openid`
3. Click **Update**
4. Click **Save and Continue**

### 3.5 Add Test Users (Development Only)

1. Click **Add Users**
2. Enter your email address (the one you'll test with)
3. Add any other test user emails (team members)
4. Click **Add**
5. Click **Save and Continue**

### 3.6 Review and Finish

1. Review your configuration
2. Click **Back to Dashboard**

---

## Step 4: Create OAuth Client ID (3 minutes)

### 4.1 Navigate to Credentials

1. Click hamburger menu (☰) → **APIs & Services** → **Credentials**

### 4.2 Create OAuth Client ID

1. Click **+ Create Credentials** (top of page)
2. Select **OAuth client ID**

### 4.3 Configure OAuth Client

**Application type**: `Web application`

**Name**: `Ottopen Web Client`

### 4.4 Add Authorized JavaScript Origins

Click **+ Add URI** under "Authorized JavaScript origins"

Add these URIs (one at a time):

1. `http://localhost:3000`
2. `https://wkvatudgffosjfwqyxgt.supabase.co`

**For production, also add:** 3. `https://your-production-domain.com`

### 4.5 Add Authorized Redirect URIs

Click **+ Add URI** under "Authorized redirect URIs"

**⚠️ CRITICAL: This MUST be exact**

Add this URI:

```
https://wkvatudgffosjfwqyxgt.supabase.co/auth/v1/callback
```

**Optional for local testing:**

```
http://localhost:3000/auth/callback
```

### 4.6 Create and Save Credentials

1. Click **Create**
2. **IMPORTANT**: A modal will appear with your credentials

**📋 Copy these NOW (you'll need them in Step 5):**

```
Client ID: xxxxx.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxx
```

**⚠️ Save these securely** - you'll need them for Supabase

3. Click **OK** to close the modal

**Note**: You can always retrieve these later from the Credentials page

---

## Step 5: Configure Supabase (3 minutes)

### 5.1 Go to Supabase Dashboard

Open: https://app.supabase.com/

### 5.2 Select Your Project

1. Find and click on project: **Ottopen**
   - Project ID: `wkvatudgffosjfwqyxgt`
   - Region: `us-east-2`

### 5.3 Navigate to Authentication Providers

1. In left sidebar, click **Authentication**
2. Click **Providers** tab

### 5.4 Enable Google Provider

1. Scroll down to find **Google** in the provider list
2. Click to expand the Google provider section

### 5.5 Configure Google Provider

Toggle **Enable Google provider** to ON

**Client ID (for OAuth)**:

```
Paste your Client ID from Step 4.6
```

**Client Secret (for OAuth)**:

```
Paste your Client Secret from Step 4.6
```

**Redirect URL** (Pre-filled by Supabase - verify it matches):

```
https://wkvatudgffosjfwqyxgt.supabase.co/auth/v1/callback
```

**Skip if this is null**: Leave unchecked

### 5.6 Save Configuration

1. Click **Save** at the bottom
2. Wait for "Successfully saved" confirmation

---

## Step 6: Configure Site URL (1 minute)

### 6.1 Navigate to URL Configuration

1. Still in **Authentication** section
2. Click **URL Configuration** tab (or scroll down)

### 6.2 Set Site URL

**Site URL**: `http://localhost:3000`

- For production: `https://your-production-domain.com`

### 6.3 Add Redirect URLs

**Redirect URLs** (add these):

```
http://localhost:3000/**
http://localhost:3000/auth/callback
```

**For production, also add:**

```
https://your-production-domain.com/**
https://your-production-domain.com/auth/callback
```

### 6.4 Save

Click **Save** at the bottom

---

## Step 7: Test OAuth Flow (5 minutes)

### 7.1 Start Your Dev Server

```bash
cd /Users/emmanuelakangbou/Downloads/script-soiree-main
npm run dev
```

Wait for: `Ready on http://localhost:3000`

### 7.2 Test Sign In with Google

1. Open browser: http://localhost:3000/auth/signin
2. You should see **"Sign in with Google"** button
3. Click the button

**Expected Flow:**

1. ✅ Redirects to Google OAuth consent screen
2. ✅ Shows "Ottopen wants to access your Google Account"
3. ✅ Lists permissions: email, profile, openid
4. ✅ Select your Google account
5. ✅ Click "Continue" or "Allow"
6. ✅ Redirects back to your app
7. ✅ Lands on `/feed` page
8. ✅ Shows your profile in navigation

### 7.3 Verify Profile Created

**Option A: Check Supabase Dashboard**

1. Go to Supabase Dashboard
2. Click **Authentication** → **Users**
3. You should see your Google account
4. Provider: `google`
5. Email confirmed: ✅

**Option B: Check Database**

1. Go to **Table Editor** → **users** table
2. Find row with your email
3. Verify fields populated:
   - `display_name`: From Google
   - `email`: From Google
   - `avatar_url`: From Google
   - `verification_status`: `verified`

### 7.4 Test Sign Out and Sign In Again

1. Sign out of your app
2. Go to `/auth/signin`
3. Click "Sign in with Google"
4. Should sign in immediately (no consent screen)
5. Lands on `/feed`

✅ **If all tests pass, OAuth is working!**

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Symptom**: Google shows error page with "Error 400: redirect_uri_mismatch"

**Solution**:

1. Go to Google Cloud Console → Credentials
2. Click on your OAuth client ID
3. Verify **Authorized redirect URIs** includes EXACTLY:
   ```
   https://wkvatudgffosjfwqyxgt.supabase.co/auth/v1/callback
   ```
4. No extra spaces, no trailing slashes
5. Click **Save**
6. Wait 5 minutes for changes to propagate
7. Try again

### Error: "Access blocked: This app's request is invalid"

**Symptom**: Google blocks access with security warning

**Solution**:

1. Go to Google Cloud Console → OAuth consent screen
2. Check **Publishing status**: Should be "Testing"
3. Verify your email is listed in **Test users**
4. Add your email if missing
5. Try again

### Button Appears But Nothing Happens

**Symptom**: Click "Sign in with Google" but nothing happens

**Solution**:

1. Open browser console (F12)
2. Check for errors
3. Common causes:
   - Google provider not enabled in Supabase
   - Client ID or Secret incorrect
   - Supabase project not configured
4. Go back to Step 5 and verify configuration

### Profile Not Created in Database

**Symptom**: OAuth works but user profile not in `users` table

**Solution**:

1. Go to Supabase Dashboard → **Database** → **Logs**
2. Look for errors during profile creation
3. Common causes:
   - RLS policies blocking insert
   - Missing columns in users table
4. Check callback handler: `app/auth/callback/route.ts`
5. Verify RLS policy allows authenticated users to insert

### "This app hasn't been verified" Warning

**Symptom**: Google shows warning screen before consent

**Solution**:

- This is normal for apps in "Testing" mode
- For development: Click "Advanced" → "Go to Ottopen (unsafe)"
- For production: Submit app for verification (takes 1-2 weeks)

---

## Production Checklist

Before deploying to production:

### Update Google Cloud Console

- [ ] Add production domain to Authorized JavaScript origins
- [ ] Add production callback URL to Authorized redirect URIs
- [ ] Publish OAuth consent screen (or submit for verification)
- [ ] Add production domain to Authorized domains

### Update Supabase

- [ ] Change Site URL to production domain
- [ ] Add production redirect URLs
- [ ] Test on production URL

### Security

- [ ] Remove localhost URLs from production config
- [ ] Keep Client Secret secure (environment variables)
- [ ] Monitor OAuth usage
- [ ] Set up error alerts

---

## Verification Checklist

✅ **Configuration Complete When:**

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth client ID created
- [ ] Client ID and Secret copied
- [ ] Google provider enabled in Supabase
- [ ] Credentials pasted into Supabase
- [ ] Site URL configured
- [ ] Test OAuth flow works
- [ ] User profile created in database
- [ ] Can sign out and sign in again

---

## Quick Reference

### Your Configuration Details

**Supabase Project**: Ottopen
**Project ID**: `wkvatudgffosjfwqyxgt`
**Region**: `us-east-2`

**Supabase OAuth Callback URL** (use this in Google Console):

```
https://wkvatudgffosjfwqyxgt.supabase.co/auth/v1/callback
```

**Supabase Project URL**:

```
https://wkvatudgffosjfwqyxgt.supabase.co
```

### Where to Get Credentials

**Google Cloud Console**:

- https://console.cloud.google.com/
- APIs & Services → Credentials

**Supabase Dashboard**:

- https://app.supabase.com/
- Project: Ottopen → Authentication → Providers

---

## Need Help?

**Documentation**:

- Full guide: `GOOGLE_OAUTH_SETUP.md`
- Implementation: `GOOGLE_OAUTH_IMPLEMENTATION_COMPLETE.md`
- Testing: `START_TESTING_NOW.md`

**Support**:

- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- Supabase Auth: https://supabase.com/docs/guides/auth

---

**Status**: Ready to configure ⚙️
**Estimated Time**: 15-20 minutes
**Difficulty**: Easy (follow steps exactly)

**Start with Step 1 above** ☝️
