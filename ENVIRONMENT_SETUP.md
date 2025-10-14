# Environment Variables Setup Guide

This guide ensures all required environment variables are configured for production deployment.

## ✅ Required Environment Variables

### 1. **Application URL**

```bash
NEXT_PUBLIC_APP_URL=https://www.ottopen.app
```

- Used for: OAuth callbacks, email links, Stripe redirects
- **Action**: Set in Vercel dashboard

### 2. **Supabase Configuration**

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

- **Action**: Get from Supabase Dashboard → Project Settings → API
- Service role key is **SECRET** - only for server-side use

### 3. **Stripe Configuration**

#### Secret Keys (Server-only)

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

- **Action**: Get from Stripe Dashboard
- Webhook secret: After creating webhook endpoint at `https://www.ottopen.app/api/webhooks/stripe`

#### Price IDs (Public)

```bash
# Writer Plans
NEXT_PUBLIC_STRIPE_PRICE_PREMIUM=price_1SAfAzA5S8NBMyaJe432bhP1    # $20/mo
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_1SAfkcA5S8NBMyaJ0vq40DL0         # $50/mo

# Industry Plans
NEXT_PUBLIC_STRIPE_PRICE_INDUSTRY_BASIC=price_1SAfknA5S8NBMyaJZ60tkxRZ      # $200/mo - External Agent
NEXT_PUBLIC_STRIPE_PRICE_INDUSTRY_PREMIUM=price_1SAfl2A5S8NBMyaJfbGJNWch   # $500/mo - Producer Premium
NEXT_PUBLIC_STRIPE_PRICE_PUBLISHER=price_1SAflHA5S8NBMyaJ9k93hL7Q          # $300/mo - Publisher Access

# Optional (deprecated, for backward compatibility)
STRIPE_PRICE_BASIC=price_1SAfAzA5S8NBMyaJe432bhP1
```

- **Action**: These are your actual price IDs from the Stripe account analysis
- Copy-paste the block above into Vercel environment variables

#### Optional Stripe Settings

```bash
STRIPE_APP_FEE_PERCENT=10  # Platform fee for job marketplace
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # For client-side checkout
```

### 4. **Upstash Redis (Rate Limiting)**

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

- **Action**: Create free Redis database at https://console.upstash.com/
- Get URL and token from database details
- **Auto-enables** rate limiting when set (gracefully disabled if missing)
- Protects: AI endpoints (10/min), Auth (5/min), API (100/min), Payouts (5/5min)

### 5. **Sentry Error Tracking** (Optional but Recommended)

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
```

- **Action**: Sign up at https://sentry.io and create a Next.js project
- Get DSN from project settings

### 6. **Node Environment**

```bash
NODE_ENV=production
```

- **Action**: Vercel sets this automatically in production

---

## 🔧 Quick Setup Commands

### Option 1: Using Vercel CLI

```bash
# Add all environment variables at once
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_STRIPE_PRICE_PREMIUM production
vercel env add NEXT_PUBLIC_STRIPE_PRICE_PRO production
vercel env add NEXT_PUBLIC_STRIPE_PRICE_INDUSTRY_BASIC production
vercel env add NEXT_PUBLIC_STRIPE_PRICE_INDUSTRY_PREMIUM production
vercel env add NEXT_PUBLIC_STRIPE_PRICE_PUBLISHER production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
```

### Option 2: Using Vercel Dashboard

1. Go to: https://vercel.com/your-org/ottopen/settings/environment-variables
2. Add each variable from the list above
3. Select "Production" environment
4. Click "Save"

---

## 📋 Post-Deployment Checklist

### Supabase Configuration

- [ ] Enable leaked password protection
  - Go to: Supabase Dashboard → Authentication → Password Settings
  - Enable: "Prevent sign up with breached passwords"

- [ ] Apply database migrations

  ```bash
  supabase db push
  ```

  - Migrations to apply:
    - `20251213000000_fix_eligible_recipients_view.sql`
    - `20251213000001_fix_weak_admin_check.sql`

- [ ] Optional: Review RLS policies for performance
  - Check for overlapping permissive policies on high-traffic tables
  - Use `EXPLAIN ANALYZE` on slow queries

### Stripe Configuration

- [ ] Set up webhook endpoint
  1. Go to: Stripe Dashboard → Developers → Webhooks
  2. Add endpoint: `https://www.ottopen.app/api/webhooks/stripe`
  3. Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `account.updated`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.dispute.created`
  4. Copy webhook secret → Set as `STRIPE_WEBHOOK_SECRET`

- [ ] Verify price IDs in dashboard match environment variables
- [ ] Test checkout flow in live mode
- [ ] Test webhook delivery (Stripe Dashboard → Webhooks → Test)

### Upstash Redis (Optional)

- [ ] Create free Redis database at https://console.upstash.com/
- [ ] Copy REST URL and token to environment variables
- [ ] Verify rate limiting is active (check logs after deployment)

### Sentry (Optional)

- [ ] Create project at https://sentry.io
- [ ] Add DSN to environment variables
- [ ] Verify error tracking is working (trigger a test error)

### Security Headers (Optional - Future Enhancement)

- [ ] Add CSP nonces to remove `unsafe-inline` when feasible
- [ ] Configure in `next.config.js` or Vercel headers

---

## 🧪 Testing Environment Variables

### Local Development (.env.local)

```bash
# Copy this template to .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Use Stripe test mode for development
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
NEXT_PUBLIC_STRIPE_PRICE_PREMIUM=price_test_...
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_test_...

# Optional for local testing
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Verify Configuration

Run the health check endpoint:

```bash
curl https://www.ottopen.app/api/health
```

Expected response (admin-only for detailed info):

```json
{
  "status": "healthy",
  "timestamp": "2025-01-13T..."
}
```

---

## 🆘 Troubleshooting

### Issue: Settings page spinner never stops

**Cause**: Server auth cookies not set correctly
**Fix**: Verify `NEXT_PUBLIC_APP_URL` matches your domain exactly (no trailing slash)

### Issue: Stripe checkout fails

**Cause**: Missing or incorrect price IDs
**Fix**:

1. Check Stripe Dashboard → Products → Pricing
2. Verify price IDs match environment variables
3. Ensure using live mode keys (`sk_live_...` not `sk_test_...`)

### Issue: Rate limiting not working

**Cause**: Upstash Redis not configured
**Fix**: This is optional - add UPSTASH vars or leave disabled (app works without it)

### Issue: Webhook not receiving events

**Cause**: Wrong endpoint URL or secret
**Fix**:

1. Verify endpoint: `https://www.ottopen.app/api/webhooks/stripe`
2. Test webhook in Stripe Dashboard
3. Check webhook secret matches `STRIPE_WEBHOOK_SECRET`

---

## 📊 Current Status

Based on your Stripe account analysis:

✅ **Configured Price IDs:**

- Premium: `price_1SAfAzA5S8NBMyaJe432bhP1` ($20/mo)
- Pro: `price_1SAfkcA5S8NBMyaJ0vq40DL0` ($50/mo)
- Industry Basic: `price_1SAfknA5S8NBMyaJZ60tkxRZ` ($200/mo)
- Industry Premium: `price_1SAfl2A5S8NBMyaJfbGJNWch` ($500/mo)
- Publisher: `price_1SAflHA5S8NBMyaJ9k93hL7Q` ($300/mo)

✅ **Webhook Handler:** Ready at `/api/webhooks/stripe`

- Handles subscription events
- Updates user tiers automatically
- Tracks referral earnings
- Logs all events for audit

✅ **Rate Limiting:** Auto-enabled when Upstash configured

- AI endpoints: 10 requests/minute
- Auth endpoints: 5 requests/minute
- General API: 100 requests/minute
- Payout endpoints: 5 requests/5 minutes

---

## 🚀 Ready for Production

Once all environment variables are set:

1. Deploy to Vercel (automatic on git push)
2. Run post-deployment checklist
3. Test key user flows:
   - Sign up / Sign in
   - Subscribe to a plan
   - Receive webhook event
   - Use AI features (if Upstash configured)
4. Monitor Sentry for errors (if configured)

Your application is production-ready! 🎉
