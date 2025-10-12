# Google OAuth Setup Guide for Ottopen

This guide will walk you through setting up Google OAuth authentication for your Ottopen application.

## Prerequisites

- Supabase project (free plan supports OAuth with 50 MAU included)
- Google Cloud Console access
- Admin access to your Supabase project

---

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### 1.2 Enable Google+ API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable**

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (unless you have Google Workspace)
3. Click **Create**

**App Information:**

- **App name**: Ottopen
- **User support email**: Your email
- **App logo**: (Optional) Upload your logo

**App Domain:**

- **Application home page**: `https://your-domain.com`
- **Privacy policy**: `https://your-domain.com/legal/privacy`
- **Terms of service**: `https://your-domain.com/legal/terms`

**Developer contact information:**

- Add your email address

4. Click **Save and Continue**

**Scopes:**

1. Click **Add or Remove Scopes**
2. Add these scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
3. Click **Update** → **Save and Continue**

**Test Users** (Development Only):

1. Add test user emails (your email and any testers)
2. Click **Save and Continue**

3. Review and click **Back to Dashboard**

### 1.4 Create OAuth Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**

**Configuration:**

- **Name**: Ottopen Web Client
- **Authorized JavaScript origins**:
  - `http://localhost:3000` (for development)
  - `https://your-production-domain.com` (for production)
- **Authorized redirect URIs**:
  - `https://wkvatudgffosjfwqyxgt.supabase.co/auth/v1/callback`
  - For local testing, you may also add:
    - `http://localhost:3000/auth/callback`

4. Click **Create**
5. **Save your credentials**:
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxx`

---

## Step 2: Configure Supabase

### 2.1 Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your **Ottopen** project (ID: `wkvatudgffosjfwqyxgt`)

### 2.2 Enable Google Provider

1. In the left sidebar, go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Click to expand

**Configuration:**

- **Enable Google provider**: Toggle ON
- **Client ID**: Paste from Google Cloud Console
- **Client Secret**: Paste from Google Cloud Console
- **Redirect URL**: (Pre-filled by Supabase)
  - `https://wkvatudgffosjfwqyxgt.supabase.co/auth/v1/callback`

4. Click **Save**

### 2.3 Configure Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**:
   - Development: `http://localhost:3000`
   - Production: `https://your-production-domain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-production-domain.com/auth/callback` (production)
4. Click **Save**

---

## Step 3: Verify Implementation (Already Done!)

The following components have been implemented in your codebase:

### ✅ OAuth Button Component

- **File**: `src/components/auth/google-oauth-button.tsx`
- Handles Google sign-in flow
- Shows loading states
- Error handling with toast notifications

### ✅ OAuth Callback Handler

- **File**: `app/auth/callback/route.ts`
- Exchanges OAuth code for session
- Creates user profile if doesn't exist
- Redirects to feed on success

### ✅ Sign In Page Updated

- **File**: `app/auth/signin/page.tsx`
- Google OAuth button added
- "Or continue with email" divider
- Maintains existing email/password flow

### ✅ Sign Up Page Updated

- **File**: `app/auth/signup/page.tsx`
- Google OAuth button on first step
- Seamless integration with multi-step form
- Maintains existing registration flow

---

## Step 4: Testing

### 4.1 Development Testing

1. Start your dev server:

   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/auth/signin`

3. Click **Sign in with Google**

4. You should be redirected to Google's OAuth consent screen

5. After granting permissions, you'll be redirected back to `/feed`

### 4.2 Verify User Profile

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. You should see your Google account listed
3. Go to **Database** → **Table Editor** → **users**
4. Verify your profile was created with:
   - Email from Google
   - Display name from Google
   - Avatar URL from Google
   - Account tier: `free`
   - Verification status: `verified`

### 4.3 Test Sign Up

1. Navigate to: `http://localhost:3000/auth/signup`
2. Click **Sign up with Google**
3. Should work identically to sign-in (Google doesn't distinguish)

---

## Step 5: Production Deployment

### Before Deploying to Production:

1. **Update Google Cloud Console**:
   - Add production domain to **Authorized JavaScript origins**
   - Add production callback to **Authorized redirect URIs**:
     - `https://your-domain.com/auth/callback`

2. **Update Supabase**:
   - Go to **Authentication** → **URL Configuration**
   - Update **Site URL** to production domain
   - Add production redirect URL

3. **Publish OAuth Consent Screen** (Important!):
   - Go to Google Cloud Console → **OAuth consent screen**
   - Click **Publish App**
   - Submit for verification if you'll have >100 users
   - Note: Unverified apps show a warning screen to users

4. **Test Production**:
   - Test OAuth flow on production domain
   - Verify redirects work correctly
   - Check user profiles are created

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Solution**: Ensure the redirect URI in Google Cloud Console exactly matches:

```
https://wkvatudgffosjfwqyxgt.supabase.co/auth/v1/callback
```

### Error: "Access blocked: This app's request is invalid"

**Solution**:

1. Verify scopes are correctly configured in OAuth consent screen
2. Ensure app is in "Testing" mode and your email is added as a test user
3. Or publish the app

### Error: "User profile not created"

**Solution**: Check Supabase logs:

1. Go to **Database** → **Logs**
2. Look for errors during profile creation
3. Ensure RLS policies allow insert for authenticated users

### OAuth Works But User Not Redirected

**Solution**: Check callback route:

1. Verify `app/auth/callback/route.ts` exists
2. Check browser console for errors
3. Verify session is being created in Supabase

---

## Security Best Practices

### 1. Keep Credentials Secret

- Never commit Google Client Secret to version control
- Use environment variables for all secrets
- Rotate secrets if accidentally exposed

### 2. Validate Redirect URLs

- Only whitelist your actual domains
- Don't use wildcards in production
- Remove localhost URLs from production config

### 3. Review OAuth Scopes

- Only request necessary scopes
- Current scopes: email, profile, openid
- Users can revoke access at any time

### 4. Monitor Usage

- Check Google Cloud Console → **APIs & Services** → **Credentials**
- Monitor OAuth usage and quotas
- Set up billing alerts if needed

---

## Cost Information

### Google Cloud (OAuth)

- **Free Tier**: Unlimited OAuth requests
- **No credit card required** for OAuth functionality
- Only paid if you use other Google Cloud services

### Supabase (Free Plan)

- **MAU Limit**: 50,000 Monthly Active Users
- **OAuth Support**: ✅ Included on free plan
- **No additional cost** for Google OAuth

---

## Additional Features

### Profile Enrichment

When users sign in with Google, the system automatically:

- Extracts full name → `display_name`
- Extracts email → `email`
- Downloads avatar → `avatar_url`
- Sets verification status to `verified`
- Generates username from email

### Linking Accounts (Future Enhancement)

To allow users to link Google account to existing email/password account:

1. Add account linking UI in settings
2. Use `supabase.auth.linkIdentity()`
3. Update user profile

---

## Support

### Google OAuth Issues

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google OAuth Troubleshooting](https://developers.google.com/identity/protocols/oauth2/web-server#troubleshooting)

### Supabase Issues

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Support](https://supabase.com/support)

---

## Summary

✅ **Implementation Complete**

- Google OAuth button on sign-in page
- Google OAuth button on sign-up page
- Callback handler for OAuth flow
- Automatic user profile creation
- Error handling and loading states

✅ **Free Plan Compatible**

- Supported on Supabase free tier
- 50,000 MAU included
- No additional costs

🔧 **Next Steps**

1. Follow Step 1 to create Google OAuth credentials
2. Follow Step 2 to configure Supabase
3. Test with Step 4
4. Deploy to production with Step 5

---

**Status**: ✅ Code implementation complete - Awaiting OAuth configuration in Google Cloud Console and Supabase Dashboard

**Estimated Setup Time**: 15-20 minutes

**Ready to test after configuration!** 🚀
