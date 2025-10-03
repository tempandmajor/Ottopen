# 🚀 Production Deployment Setup

All critical fixes are complete! Follow these steps to deploy:

---

## ✅ What We Fixed

1. **✅ Created Stripe Checkout Endpoint**
   - New endpoint: `/app/api/checkout/route.ts`
   - Users can now subscribe to paid plans
   - Supports referral code tracking

2. **✅ Fixed Webhook Earnings Generation**
   - Webhook now creates `referral_earnings` records automatically
   - 20% commission calculated on subscription amount
   - Earnings marked as "pending" until payout

3. **✅ Fixed All RLS Policies** (10 tables)
   - achievements
   - club_activity
   - club_events
   - club_invitations
   - critique_submissions
   - critiques
   - discussion_replies
   - event_participants
   - reading_progress
   - reading_schedules

4. **✅ Fixed Function Security** (13 functions)
   - All functions now have `SET search_path = public`
   - Eliminates security vulnerabilities

---

## 📋 Deployment Checklist

### Step 1: Configure Stripe Webhook

You need to add a webhook endpoint in Stripe Dashboard to receive subscription events.

**Option A: Stripe Dashboard (Recommended)**

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter webhook URL:
   ```
   https://ottopen.app/api/webhooks/stripe
   ```
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `account.updated`
5. Click **"Add endpoint"**
6. **Copy the webhook signing secret** (starts with `whsec_`)

**Option B: Stripe CLI (For Local Testing)**

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

---

### Step 2: Add Environment Variables to Vercel

Run this command to add all required environment variables:

```bash
# Get Stripe Keys from: https://dashboard.stripe.com/apikeys
vercel env add STRIPE_SECRET_KEY

# Get Webhook Secret from Step 1 above
vercel env add STRIPE_WEBHOOK_SECRET

# Get from Supabase: https://supabase.com/dashboard/project/wkvatudgffosjfwqyxgt/settings/api
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Production URL
vercel env add NEXT_PUBLIC_APP_URL

# Optional: Price ID mappings (get from https://dashboard.stripe.com/prices)
vercel env add STRIPE_PRICE_PREMIUM
vercel env add STRIPE_PRICE_PRO
vercel env add STRIPE_PRICE_INDUSTRY_BASIC
vercel env add STRIPE_PRICE_INDUSTRY_PREMIUM
```

**Or add via Vercel Dashboard:**

1. Go to: https://vercel.com/ottopens-projects/ottopen/settings/environment-variables
2. Add these variables for **Production, Preview, and Development**:

| Variable                        | Value                  | Where to Get It                                                                                               |
| ------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`             | `sk_live_...`          | [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)                                           |
| `STRIPE_WEBHOOK_SECRET`         | `whsec_...`            | From Step 1 (webhook creation)                                                                                |
| `SUPABASE_SERVICE_ROLE_KEY`     | `eyJ...`               | [Supabase → Project Settings → API](https://supabase.com/dashboard/project/wkvatudgffosjfwqyxgt/settings/api) |
| `NEXT_PUBLIC_APP_URL`           | `https://ottopen.app`  | Your production domain                                                                                        |
| `STRIPE_PRICE_PREMIUM`          | `price_xxx` (optional) | [Stripe Dashboard → Products](https://dashboard.stripe.com/prices)                                            |
| `STRIPE_PRICE_PRO`              | `price_xxx` (optional) | [Stripe Dashboard → Products](https://dashboard.stripe.com/prices)                                            |
| `STRIPE_PRICE_INDUSTRY_BASIC`   | `price_xxx` (optional) | [Stripe Dashboard → Products](https://dashboard.stripe.com/prices)                                            |
| `STRIPE_PRICE_INDUSTRY_PREMIUM` | `price_xxx` (optional) | [Stripe Dashboard → Products](https://dashboard.stripe.com/prices)                                            |

---

### Step 3: Deploy to Production

```bash
git add .
git commit -m "fix: Add checkout endpoint and fix all security issues"
git push origin main
```

Vercel will automatically deploy when you push to `main`.

---

### Step 4: Test the Full Flow

**A. Test Subscription Flow:**

1. Go to your production site
2. Navigate to pricing page
3. Click "Subscribe" on a plan
4. Complete checkout with test card: `4242 4242 4242 4242`
5. Verify:
   - User is redirected to dashboard
   - Subscription appears in Stripe Dashboard
   - Webhook received (check Vercel logs)
   - User tier updated in database

**B. Test Referral Flow:**

1. User A generates referral code
2. User B signs up with referral code
3. User B subscribes to paid plan
4. Verify:
   - Referral status changes to "confirmed"
   - `referral_earnings` record created
   - User A sees pending earnings

**C. Test Payout Flow:**

1. User with ≥$10 earnings requests payout
2. Verify Stripe Connect onboarding completes
3. Check payout request created
4. (Manual) Process payout via Stripe Connect

---

## 🔐 Security Verification

After deployment, verify all security fixes:

```bash
# Check Supabase Security Advisor
# Go to: https://supabase.com/dashboard/project/wkvatudgffosjfwqyxgt/advisors/security

# Should see 0 critical issues
```

---

## 🧪 Testing URLs

**Production:**

- App: https://ottopen.app
- Checkout: https://ottopen.app/pricing
- Referrals: https://ottopen.app/referrals (or wherever you implement it)

**Stripe Dashboard:**

- Webhooks: https://dashboard.stripe.com/webhooks
- Subscriptions: https://dashboard.stripe.com/subscriptions
- Connect Accounts: https://dashboard.stripe.com/connect/accounts

**Supabase Dashboard:**

- Database: https://supabase.com/dashboard/project/wkvatudgffosjfwqyxgt/editor
- Auth: https://supabase.com/dashboard/project/wkvatudgffosjfwqyxgt/auth/users
- Logs: https://supabase.com/dashboard/project/wkvatudgffosjfwqyxgt/logs/explorer

---

## 📊 Price IDs Reference

Your Stripe prices (from audit):

| Product                | Price ID                         | Amount     | Type      |
| ---------------------- | -------------------------------- | ---------- | --------- |
| Premium Features       | `price_1SAfAzA5S8NBMyaJe432bhP1` | $20/month  | recurring |
| Writer Pro Plan        | `price_1SAfkcA5S8NBMyaJ0vq40DL0` | $50/month  | recurring |
| External Agent Access  | `price_1SAfknA5S8NBMyaJZ60tkxRZ` | $200/month | recurring |
| Publisher Access       | `price_1SAfl2A5S8NBMyaJfbGJNWch` | $500/month | recurring |
| Producer Premium       | `price_1SAflHA5S8NBMyaJ9k93hL7Q` | $300/month | recurring |
| Job Posting - Standard | `price_1SAg3mA5S8NBMyaJR78Fcw59` | $99        | one-time  |
| Job Posting - Featured | `price_1SAg42A5S8NBMyaJRgLQf1l8` | $199       | one-time  |

Use these in your pricing UI or map to tiers in environment variables.

---

## 🆘 Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct: `https://ottopen.app/api/webhooks/stripe`
2. Check webhook secret is in Vercel env vars
3. Check Vercel function logs for errors
4. Test webhook manually in Stripe Dashboard → Webhooks → Send test event

### Subscriptions Not Creating

1. Check Stripe checkout session includes metadata
2. Check `stripe_customer_id` is saved to user record
3. Check Vercel logs for checkout errors
4. Verify price IDs are correct

### RLS Errors

1. Check all policies were applied via Supabase MCP
2. Verify user authentication is working
3. Check Supabase logs for specific RLS denials

---

## ✨ You're Ready!

Once you complete these 4 steps, your platform will have:

- ✅ Working subscription checkout
- ✅ Cash referral system with earnings tracking
- ✅ Stripe Connect payouts
- ✅ All security vulnerabilities fixed
- ✅ Production-ready webhook handling

**Estimated Setup Time:** 15-20 minutes

---

## 📞 Support

- Stripe Docs: https://stripe.com/docs
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs

Good luck with your launch! 🚀
