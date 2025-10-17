# Credential Rotation Guide

**Date Created:** 2025-10-16
**Status:** PENDING - Rotation required before next deployment
**Priority:** CRITICAL

## Overview

All credentials that were previously committed to the repository **must be rotated immediately** before deploying any new builds. This guide provides step-by-step instructions for rotating each exposed credential.

## Exposed Credentials Summary

- **Supabase Project:** wkvatudgffosjfwqyxgt (Ottopen)
- **Upstash Redis:** smiling-cricket-21202.upstash.io
- **Stripe:** Production workspace credentials
- **SendGrid:** API keys
- **Internal Secrets:** Webhook signing keys

## Step-by-Step Rotation Instructions

### 1. Supabase Credentials

**Project:** Ottopen (wkvatudgffosjfwqyxgt)
**Dashboard:** https://dashboard.supabase.com/project/wkvatudgffosjfwqyxgt

#### 1.1 Rotate API Keys

1. Go to **Settings → API** in Supabase Dashboard
2. Under "Project API keys", click **Reset** for:
   - `anon` key (public)
   - `service_role` key (secret)
3. **IMPORTANT:** Save both new keys immediately
4. Old keys will be invalidated

**New Keys:**

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-new-anon-key-here>
SUPABASE_SERVICE_ROLE_KEY=<paste-new-service-role-key-here>
```

#### 1.2 Revoke All User Sessions

1. Go to **Authentication → Users** in Supabase Dashboard
2. For each user, click **...** → **Sign Out User**
3. OR use SQL to bulk revoke:

```sql
-- Revoke all refresh tokens
UPDATE auth.refresh_tokens SET revoked = true WHERE revoked = false;
```

#### 1.3 Enable Additional Security

1. Go to **Authentication → Settings**
2. Enable **Email Confirmation** if not already enabled
3. Consider enabling **Multi-Factor Authentication**
4. Review **Auth Logs** for suspicious activity

### 2. Stripe Credentials

**Dashboard:** https://dashboard.stripe.com/

#### 2.1 Rotate Secret Key

1. Go to **Developers → API keys**
2. Click **Create secret key**
3. Give it a name: `Production Key - Rotated 2025-10-16`
4. Copy the new secret key
5. **Delete the old secret key** once verified working

**New Key:**

```bash
STRIPE_SECRET_KEY=sk_live_<paste-new-key-here>
```

#### 2.2 Rotate Webhook Signing Secret

1. Go to **Developers → Webhooks**
2. Find your production webhook endpoint
3. Click **...** → **Update endpoint**
4. Click **Roll signing secret**
5. Copy the new webhook signing secret

**New Secret:**

```bash
STRIPE_WEBHOOK_SECRET=whsec_<paste-new-secret-here>
```

### 3. SendGrid API Key

**Dashboard:** https://app.sendgrid.com/settings/api_keys

1. Click **Create API Key**
2. Name: `Production Key - Rotated 2025-10-16`
3. Permissions: **Full Access** (or minimum required scopes)
4. Click **Create & View**
5. Copy the API key immediately (won't be shown again)
6. **Delete the old API key** from the list

**New Key:**

```bash
SENDGRID_API_KEY=SG.<paste-new-key-here>
```

### 4. Upstash Redis Token

**Console:** https://console.upstash.com/

1. Go to your Redis database: **smiling-cricket-21202**
2. Click **Details** tab
3. Under **REST API**, click **Reset Token**
4. Confirm the rotation
5. Copy the new `UPSTASH_REDIS_REST_TOKEN`

**New Token:**

```bash
UPSTASH_REDIS_REST_URL=https://smiling-cricket-21202.upstash.io
UPSTASH_REDIS_REST_TOKEN=<paste-new-token-here>
```

### 5. Internal Webhook Secret

**Generated:** ✅ Already created

```bash
INTERNAL_WEBHOOK_SECRET=LXnb+YyXavPGCIdiHJSzaMdFndcEelt+fV6I5yXQMSg=
```

### 6. Update Vercel Environment Variables

**Project:** ottopen (or your Vercel project name)
**Dashboard:** https://vercel.com/

#### For Each Environment (Production, Preview, Development):

1. Go to **Settings → Environment Variables**
2. Update the following variables with NEW values from above:

**Required Variables:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wkvatudgffosjfwqyxgt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<new-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<new-service-role-key>

# Stripe
STRIPE_SECRET_KEY=<new-stripe-key>
STRIPE_WEBHOOK_SECRET=<new-webhook-secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<unchanged-unless-rotated>

# SendGrid
SENDGRID_API_KEY=<new-sendgrid-key>

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://smiling-cricket-21202.upstash.io
UPSTASH_REDIS_REST_TOKEN=<new-redis-token>

# Internal
INTERNAL_WEBHOOK_SECRET=LXnb+YyXavPGCIdiHJSzaMdFndcEelt+fV6I5yXQMSg=

# App Config (unchanged)
NEXT_PUBLIC_APP_URL=https://ottopen.app
NODE_ENV=production
NEXTAUTH_URL=https://ottopen.app
NEXTAUTH_SECRET=<generate-new-if-compromised>
```

3. Click **Save** for each variable
4. Check **Production**, **Preview**, and **Development** boxes as needed

### 7. Update Local Environment

Create or update `.env.local` (DO NOT COMMIT):

```bash
# Copy all the new values from above
NEXT_PUBLIC_SUPABASE_URL=https://wkvatudgffosjfwqyxgt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<new-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<new-service-role-key>

STRIPE_SECRET_KEY=<new-stripe-key>
STRIPE_WEBHOOK_SECRET=<new-webhook-secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-publishable-key>

SENDGRID_API_KEY=<new-sendgrid-key>

UPSTASH_REDIS_REST_URL=https://smiling-cricket-21202.upstash.io
UPSTASH_REDIS_REST_TOKEN=<new-redis-token>

INTERNAL_WEBHOOK_SECRET=LXnb+YyXavPGCIdiHJSzaMdFndcEelt+fV6I5yXQMSg=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 8. Verify and Deploy

1. **Test locally first:**

   ```bash
   npm run dev
   # Test auth flow, Stripe webhooks, etc.
   ```

2. **Deploy to Vercel:**

   ```bash
   git push origin main
   # Or trigger deployment from Vercel dashboard
   ```

3. **Monitor deployment:**
   - Check build logs for errors
   - Verify all environment variables are set
   - Test critical flows immediately after deployment

### 9. Post-Rotation Verification

#### Auth Flow

- [ ] Sign up new user works
- [ ] Sign in works with new credentials
- [ ] Session persists across page refreshes
- [ ] Sign out works properly

#### Stripe Integration

- [ ] Webhook endpoint receives events
- [ ] Payment creation works
- [ ] Subscription flows work

#### Database Access

- [ ] RLS policies work correctly
- [ ] Book club CRUD operations work
- [ ] Admin endpoints accessible with service-role key

#### Rate Limiting

- [ ] Redis connection successful
- [ ] Rate limits apply correctly
- [ ] No Redis connection errors in logs

### 10. Documentation

After successful rotation and verification:

1. Update `SECURITY_ROTATION_CHECKLIST.md` with completion date
2. Document rotation in internal runbook
3. Record who performed the rotation
4. Archive this guide for future reference

## Rotation Completion Checklist

- [ ] Supabase anon key rotated
- [ ] Supabase service-role key rotated
- [ ] All Supabase user sessions revoked
- [ ] Stripe secret key rotated
- [ ] Stripe webhook secret rotated
- [ ] SendGrid API key rotated
- [ ] Upstash Redis token rotated
- [ ] Internal webhook secret generated
- [ ] Vercel Production variables updated
- [ ] Vercel Preview variables updated
- [ ] Vercel Development variables updated
- [ ] Local .env.local created/updated
- [ ] Local testing completed successfully
- [ ] Deployed to production
- [ ] Production verification completed
- [ ] Documentation updated

## Emergency Contacts

- **Supabase Support:** https://supabase.com/dashboard/support
- **Stripe Support:** https://support.stripe.com/
- **Vercel Support:** https://vercel.com/support

## Notes

**Rotation Timestamp:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Performed By:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Verified By:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Issues Encountered:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

**REMEMBER:** Do not commit any files containing these new credentials to git.
