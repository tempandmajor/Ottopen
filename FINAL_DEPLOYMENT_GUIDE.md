# Final Deployment Guide - Ottopen

**Date:** 2025-10-16
**Status:** Ready for Manual Steps

## ✅ Completed Work

### Code & Security Fixes (All Committed & Pushed)

1. ✅ **Milestone 1:** All secrets scrubbed from repository
2. ✅ **Milestone 2:** Auth UI stabilized (sidebar flicker fixed)
3. ✅ **Milestone 3:** Request-scoped Supabase clients (RLS fixed)
4. ✅ **Milestone 4:** Security hardening (logging, admin guards)
5. ✅ **Database:** Function search_path vulnerabilities fixed via migration
6. ✅ **Tests:** 6/6 unit tests passing
7. ✅ **Documentation:** All guides created and committed

### Git Commits Deployed

- `abe0ed3` - Security: Scrub all committed secrets
- `7935048` - Fix: Sidebar flicker during auth hydration
- `91f2ccd` - Refactor: Request-scoped Supabase clients
- `4e9ead3` - Security: Harden logging and admin guards
- `d4709b3` - Docs: Credential rotation guide
- `f444740` - Docs: Milestones completion summary
- `954fde3` - Docs: Supabase deployment assessment

## 🔴 Manual Steps Required (Before Production Use)

### Step 1: Enable Leaked Password Protection

**Dashboard:** https://dashboard.supabase.com/project/wkvatudgffosjfwqyxgt/auth/settings

1. Click "Authentication" → "Settings"
2. Scroll to "Password Security" section
3. Toggle ON "Leaked Password Protection"
4. Click "Save"

**Why:** Prevents users from using passwords found in data breaches.

---

### Step 2: Rotate Supabase API Keys

**Dashboard:** https://dashboard.supabase.com/project/wkvatudgffosjfwqyxgt/settings/api

**CRITICAL:** These keys were exposed in git and must be rotated.

#### 2a. Reset Anon Key

1. Under "Project API keys" → "anon" → "public"
2. Click the **"Reset"** button
3. Confirm the reset
4. **IMMEDIATELY COPY** the new key
5. Save it securely (you'll need it for Vercel)

```
NEW_ANON_KEY=eyJhbG... (copy from dashboard)
```

#### 2b. Reset Service Role Key

1. Under "Project API keys" → "service_role" → "secret"
2. Click the **"Reset"** button
3. Confirm the reset
4. **IMMEDIATELY COPY** the new key
5. Save it securely (you'll need it for Vercel)

```
NEW_SERVICE_ROLE_KEY=eyJhbG... (copy from dashboard)
```

**⚠️ IMPORTANT:** Old keys stop working immediately after reset. Update Vercel before testing.

---

### Step 3: Revoke All User Sessions (Optional but Recommended)

**Dashboard:** https://dashboard.supabase.com/project/wkvatudgffosjfwqyxgt/auth/users

**Why:** Since the keys were exposed, revoke all active sessions as a precaution.

**Option A - Manual (if few users):**

1. Go to Authentication → Users
2. For each user, click "..." → "Sign Out User"

**Option B - SQL (if many users):**

1. Go to SQL Editor
2. Run this query:

```sql
UPDATE auth.refresh_tokens
SET revoked = true
WHERE revoked = false;
```

3. Users will need to sign in again with their existing passwords.

---

### Step 4: Update Vercel Environment Variables

**Vercel CLI Access:** ✅ Verified (username: hello-3974)
**Project:** ottopen (ottopens-projects)

#### Required Updates:

Use the Vercel token provided: `jbEiCVV9SMdkQ4wuje0QPyKI`

#### 4a. Update Supabase Keys

```bash
# Set the new ANON key (from Step 2a)
VERCEL_TOKEN=jbEiCVV9SMdkQ4wuje0QPyKI \
npx vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes --token jbEiCVV9SMdkQ4wuje0QPyKI

VERCEL_TOKEN=jbEiCVV9SMdkQ4wuje0QPyKI \
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --token jbEiCVV9SMdkQ4wuje0QPyKI
# Paste the NEW_ANON_KEY when prompted

# Set the new SERVICE ROLE key (from Step 2b)
VERCEL_TOKEN=jbEiCVV9SMdkQ4wuje0QPyKI \
npx vercel env rm SUPABASE_SERVICE_ROLE_KEY production --yes --token jbEiCVV9SMdkQ4wuje0QPyKI

VERCEL_TOKEN=jbEiCVV9SMdkQ4wuje0QPyKI \
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production --token jbEiCVV9SMdkQ4wuje0QPyKI
# Paste the NEW_SERVICE_ROLE_KEY when prompted
```

#### 4b. Update Internal Webhook Secret (Optional)

Already generated: `LXnb+YyXavPGCIdiHJSzaMdFndcEelt+fV6I5yXQMSg=`

```bash
VERCEL_TOKEN=jbEiCVV9SMdkQ4wuje0QPyKI \
npx vercel env rm INTERNAL_WEBHOOK_SECRET production --yes --token jbEiCVV9SMdkQ4wuje0QPyKI

VERCEL_TOKEN=jbEiCVV9SMdkQ4wuje0QPyKI \
npx vercel env add INTERNAL_WEBHOOK_SECRET production --token jbEiCVV9SMdkQ4wuje0QPyKI
# Enter: LXnb+YyXavPGCIdiHJSzaMdFndcEelt+fV6I5yXQMSg=
```

#### 4c. Verify Current Credentials (Already Set)

These are already configured in Vercel:

- ✅ `NEXT_PUBLIC_SUPABASE_URL` (correct - no change needed)
- ✅ `STRIPE_SECRET_KEY` (check if test or production)
- ✅ `STRIPE_WEBHOOK_SECRET` (needs production webhook)
- ✅ `UPSTASH_REDIS_REST_URL` (exposed but can rotate later)
- ✅ `UPSTASH_REDIS_REST_TOKEN` (exposed but can rotate later)
- ✅ `RESEND_API_KEY` (email service - verify not exposed)
- ✅ AI Provider keys (Anthropic, OpenAI, etc. - verify)

---

### Step 5: Create Local Environment File

Create `.env.local` in your project root (NOT committed to git):

```bash
# Supabase (use NEW keys from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://wkvatudgffosjfwqyxgt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NEW_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<NEW_SERVICE_ROLE_KEY>

# Stripe (verify if test or production keys)
STRIPE_SECRET_KEY=<check-your-stripe-dashboard>
STRIPE_WEBHOOK_SECRET=<for-local-testing>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<check-your-stripe-dashboard>

# Stripe Price IDs (already in Vercel)
STRIPE_PRICE_PREMIUM=price_1SAfAzA5S8NBMyaJe432bhP1
STRIPE_PRICE_PRO=price_1SAfkcA5S8NBMyaJ0vq40DL0
STRIPE_PRICE_INDUSTRY_BASIC=price_1SAfknA5S8NBMyaJZ60tkxRZ
STRIPE_PRICE_INDUSTRY_PREMIUM=price_1SAfl2A5S8NBMyaJfbGJNWch

# Upstash Redis (can rotate later if needed)
UPSTASH_REDIS_REST_URL=https://smiling-cricket-21202.upstash.io
UPSTASH_REDIS_REST_TOKEN=<from-vercel-or-upstash-dashboard>

# Internal
INTERNAL_WEBHOOK_SECRET=LXnb+YyXavPGCIdiHJSzaMdFndcEelt+fV6I5yXQMSg=

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-locally-or-copy-from-vercel>

# AI Providers (optional for local dev)
ANTHROPIC_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>
AI_PROVIDER=anthropic
```

---

### Step 6: Test Locally

```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

**Test these critical flows:**

1. ✅ Sign up new user
2. ✅ Sign in with existing user
3. ✅ Session persists on page refresh
4. ✅ Sidebar stays visible after login (no flicker)
5. ✅ Book club create/read/update/delete works
6. ✅ No console errors about missing keys

---

### Step 7: Deploy to Production

Once Vercel environment variables are updated and local testing passes:

```bash
# Trigger new deployment (automatic on push)
git push origin main

# Or manually via Vercel CLI
VERCEL_TOKEN=jbEiCVV9SMdkQ4wuje0QPyKI \
npx vercel --prod --token jbEiCVV9SMdkQ4wuje0QPyKI
```

**Monitor deployment:**

```bash
# Check recent deployments
VERCEL_TOKEN=jbEiCVV9SMdkQ4wuje0QPyKI \
npx vercel ls ottopen --token jbEiCVV9SMdkQ4wuje0QPyKI
```

---

### Step 8: Smoke Test Production

**Production URL:** Check latest deployment from `vercel ls`

Test the same flows as Step 6, but on production:

1. ✅ Sign up flow works
2. ✅ Sign in works
3. ✅ Sessions persist
4. ✅ Sidebar behavior correct
5. ✅ Book club features work
6. ✅ Stripe integration works (if configured)
7. ✅ No errors in browser console
8. ✅ Check Vercel logs for errors

---

### Step 9: Verify Security Advisories Resolved

**Dashboard:** https://dashboard.supabase.com/project/wkvatudgffosjfwqyxgt/database/lint

Should show:

- ✅ `update_user_statistics` - search_path fixed
- ✅ `update_application_statistics` - search_path fixed
- ⚠️ Leaked password protection - should be green after Step 1

---

### Step 10: Document Completion

Update `SECURITY_ROTATION_CHECKLIST.md` with:

- Rotation completion date
- Who performed the rotation
- Any issues encountered
- Verification results

---

## Current Service Status

### Supabase

- **Project:** Ottopen (wkvatudgffosjfwqyxgt)
- **Status:** ACTIVE_HEALTHY
- **Database:** 86 migrations applied ✅
- **Security:** 2/3 issues fixed, 1 pending (password protection)

### Vercel

- **Project:** ottopen (ottopens-projects)
- **Username:** hello-3974
- **Latest Deploy:** 5 minutes ago ● Ready
- **Auto-deploy:** ✅ Enabled on git push

### Stripe

- **Account:** acct_1SAf2tA5S8NBMyaJ
- **Name:** Ottopen sandbox
- **Keys:** Need to verify if test or production mode

### Other Services

- **Upstash Redis:** smiling-cricket-21202.upstash.io ✅
- **Email:** Resend (not SendGrid) ✅
- **AI:** Multiple providers configured ✅

---

## Troubleshooting

### "Invalid API key" errors after rotation

- Double-check keys were updated in Vercel Production environment
- Trigger new deployment after updating keys
- Check Vercel deployment logs for detailed errors

### Users can't sign in after key rotation

- Normal - they need to sign out and sign in again
- Sessions were invalidated when keys rotated
- If Step 3 was done, users already signed out

### Book club operations fail

- Verify RLS policies are working with new keys
- Check browser console for specific error
- Verify service_role key is correct in Vercel

### Build fails on deploy

- Check Vercel build logs
- Verify all required env vars are set
- Check for TypeScript errors (some pre-existing)

---

## Quick Reference

### Key URLs

- **Supabase Dashboard:** https://dashboard.supabase.com/project/wkvatudgffosjfwqyxgt
- **Vercel Dashboard:** https://vercel.com/
- **Stripe Dashboard:** https://dashboard.stripe.com/
- **Upstash Console:** https://console.upstash.com/

### Key Files

- `CREDENTIAL_ROTATION_GUIDE.md` - Detailed rotation steps
- `MILESTONES_COMPLETION_SUMMARY.md` - Technical summary
- `SUPABASE_DEPLOYMENT_ASSESSMENT.md` - Database status
- `SECURITY_ROTATION_CHECKLIST.md` - Quick checklist

### Support

- Supabase Issues: https://supabase.com/dashboard/support
- Vercel Support: https://vercel.com/support
- GitHub Issues: https://github.com/tempandmajor/Ottopen/issues

---

**Next Action:** Follow Steps 1-3 to rotate Supabase keys, then Step 4 to update Vercel.
