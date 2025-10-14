# Stripe Test to Live Account Transition Guide

**Current Status**: Using Stripe Test Mode
**Account**: acct_1SAf2tA5S8NBMyaJ - "Ottopen sandbox"
**When to Transition**: Before accepting real payments from customers

---

## Overview

You're currently using Stripe **Test Mode** which uses test API keys (`sk_test_`, `pk_test_`). When you're ready to accept real payments, you'll need to transition to **Live Mode** with live API keys (`sk_live_`, `pk_live_`).

**Good News**: Most of your configuration will carry over automatically, but some steps require manual recreation.

---

## What Automatically Carries Over

✅ **Your Stripe Account Settings**

- Business information
- Tax settings
- Payout schedule preferences
- Email notification settings

✅ **Your Dashboard Configuration**

- User permissions and team members
- Branding and receipts customization
- Invoice settings

---

## What You Need to Recreate in Live Mode

### ❌ Products and Prices

**Your Current Test Products** (will need to be recreated):

1. Premium Features - $20/month - `prod_T6sw8IlnPhb8xA` → `price_1SAfAzA5S8NBMyaJe432bhP1`
2. Writer Pro Plan - $50/month - `prod_T6tXPzWHY2zMGO` → `price_1SAfkcA5S8NBMyaJ0vq40DL0`
3. External Agent Access - $200/month - `prod_T6tX3d4gwFOAKJ` → `price_1SAfknA5S8NBMyaJZ60tkxRZ`
4. Producer Premium Access - $500/month - `prod_T6tYq6JomgD2xF` → `price_1SAfl2A5S8NBMyaJfbGJNWch`
5. Publisher Access - $300/month - `prod_T6tYfe3QOBvWiT` → `price_1SAflHA5S8NBMyaJ9k93hL7Q`
6. Job Posting - Standard - $99 one-time - `prod_T6trWFQC7QQGen` → `price_1SAg3mA5S8NBMyaJR78Fcw59`
7. Job Posting - Featured - $199 one-time - `prod_T6trM2MnUQSFs5` → `price_1SAg42A5S8NBMyaJRgLQf1l8`

**Why**: Products and prices are environment-specific and don't sync between test and live.

### ❌ Webhook Endpoints

**Your Current Test Webhook**:

- Endpoint ID: `we_1SI1GqA5S8NBMyaJuiUPALHR`
- URL: `https://ottopen.app/api/webhooks/stripe`
- Secret: `whsec_nTSTHcOYG5VmkQiWkyMEJl6aku2t7pVt`

**Why**: Webhook secrets are environment-specific for security.

### ❌ Test Data

All test customers, subscriptions, and payment data will not carry over (by design).

---

## Step-by-Step Transition Process

### Phase 1: Preparation (Before Going Live)

#### 1. Complete Stripe Account Activation

```
Navigate to: https://dashboard.stripe.com/settings/account
Required:
☐ Business information (legal name, address, EIN/SSN)
☐ Bank account for payouts
☐ Identity verification
☐ Business verification documents
```

**Estimated Time**: 1-3 business days for Stripe to verify

#### 2. Test Your Test Mode Setup Thoroughly

Before switching, ensure everything works in test mode:

```bash
# Use Stripe test cards
# 4242 4242 4242 4242 - Successful payment
# 4000 0000 0000 9995 - Declined payment

☐ Test subscription creation (all 4 tiers)
☐ Test subscription cancellation
☐ Test webhook events are received
☐ Test payment failures
☐ Test invoice generation
☐ Test Stripe Connect payouts (if used)
```

---

### Phase 2: Create Live Mode Resources

#### Step 1: Switch to Live Mode in Stripe Dashboard

1. Go to: https://dashboard.stripe.com
2. Click the toggle in top-right corner: "Test mode" → "Live mode"
3. You'll see "Viewing live data" banner

#### Step 2: Get Live API Keys

```bash
# Navigate to: https://dashboard.stripe.com/apikeys

# Copy these keys (you'll need them in Step 3):
Live Publishable Key: pk_live_...
Live Secret Key: sk_live_...
```

**⚠️ SECURITY**: Never commit live keys to git or share publicly

#### Step 3: Recreate Products and Prices in Live Mode

**Option A: Via Stripe Dashboard** (Recommended - Less Error-Prone)

```
1. Go to: https://dashboard.stripe.com/products (ensure Live mode)
2. Click "Add product" for each:

Product 1: Premium Features
- Name: Premium Features
- Description: Access to upcoming premium features and advanced functionality
- Pricing: $20.00 USD / month
- Recurring
- Copy the price ID (starts with price_...)

Product 2: Writer Pro Plan
- Name: Writer Pro Plan
- Description: Direct industry access, unlimited submissions, marketing tools, and priority review for serious writers
- Pricing: $50.00 USD / month
- Recurring
- Copy the price ID

Product 3: External Agent Access
- Name: External Agent Access
- Description: Co-agent relationships, manuscript access, and industry networking for literary agents
- Pricing: $200.00 USD / month
- Recurring
- Copy the price ID

Product 4: Producer Premium Access
- Name: Producer Premium Access
- Description: First-look deals, comprehensive manuscript access, and development tools for film/TV producers
- Pricing: $500.00 USD / month
- Recurring
- Copy the price ID

Product 5: Publisher Access
- Name: Publisher Access
- Description: Manuscript access and submission tools for book publishers and literary scouts
- Pricing: $300.00 USD / month
- Recurring
- Copy the price ID

Product 6: Job Posting - Standard
- Name: Job Posting - Standard
- Description: 30-day standard job posting with access to our writer network
- Pricing: $99.00 USD
- One-time
- Copy the price ID

Product 7: Job Posting - Featured
- Name: Job Posting - Featured
- Description: 30-day featured job posting with priority placement and enhanced visibility
- Pricing: $199.00 USD
- One-time
- Copy the price ID
```

**Option B: Via Stripe CLI** (Faster if you're comfortable with CLI)

```bash
# Make sure you're authenticated with live mode
stripe login

# Create products and prices
# Product 1: Premium Features
stripe products create \
  --name "Premium Features" \
  --description "Access to upcoming premium features and advanced functionality"

# Note the product ID (prod_...), then create the price:
stripe prices create \
  --product prod_XXX \
  --unit-amount 2000 \
  --currency usd \
  --recurring interval=month

# Repeat for all 7 products...
```

**Save the Live Price IDs** - You'll need these for Step 4:

```
LIVE_PRICE_PREMIUM=price_...
LIVE_PRICE_PRO=price_...
LIVE_PRICE_INDUSTRY_BASIC=price_...
LIVE_PRICE_INDUSTRY_PREMIUM=price_...
LIVE_PRICE_PUBLISHER=price_...
LIVE_PRICE_JOB_STANDARD=price_...
LIVE_PRICE_JOB_FEATURED=price_...
```

#### Step 4: Create Live Webhook Endpoint

**Via Stripe Dashboard**:

```
1. Go to: https://dashboard.stripe.com/webhooks (ensure Live mode)
2. Click "Add endpoint"
3. Endpoint URL: https://ottopen.app/api/webhooks/stripe
4. Description: Production webhook for Ottopen
5. Events to send:
   ☐ checkout.session.completed
   ☐ customer.subscription.created
   ☐ customer.subscription.updated
   ☐ customer.subscription.deleted
   ☐ invoice.payment_succeeded
   ☐ invoice.payment_failed
   ☐ payment_intent.succeeded
   ☐ payment_intent.payment_failed
6. Click "Add endpoint"
7. Copy the "Signing secret" (starts with whsec_...)
```

**Via Stripe CLI**:

```bash
stripe webhook_endpoints create \
  --url "https://ottopen.app/api/webhooks/stripe" \
  --description "Production webhook for Ottopen" \
  --enabled-events checkout.session.completed \
  --enabled-events customer.subscription.created \
  --enabled-events customer.subscription.updated \
  --enabled-events customer.subscription.deleted \
  --enabled-events invoice.payment_succeeded \
  --enabled-events invoice.payment_failed \
  --enabled-events payment_intent.succeeded \
  --enabled-events payment_intent.payment_failed

# Copy the webhook signing secret from the output
```

**Save the Live Webhook Secret**:

```
LIVE_WEBHOOK_SECRET=whsec_...
```

---

### Phase 3: Update Environment Variables

You need to update **8 environment variables** in Vercel with your new live values.

#### Option A: Via Vercel Dashboard

```
1. Go to: https://vercel.com/ottopens-projects/ottopen/settings/environment-variables
2. Update these variables (click "Edit" on each):

Variable: STRIPE_SECRET_KEY
Old Value: sk_test_51RBVgkBCmYmRaOfb... (test)
New Value: sk_live_... (from Step 2)
Target: Production, Preview, Development

Variable: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Old Value: pk_test_51RBVgkBCmYmRaOfb... (test)
New Value: pk_live_... (from Step 2)
Target: Production

Variable: STRIPE_WEBHOOK_SECRET
Old Value: whsec_nTSTHcOYG5VmkQiWkyMEJl6aku2t7pVt (test)
New Value: whsec_... (from Step 4)
Target: Production, Preview, Development

Variable: STRIPE_PRICE_PREMIUM
Old Value: price_1SAfAzA5S8NBMyaJe432bhP1 (test)
New Value: [Live price ID from Step 3]
Target: Production

Variable: NEXT_PUBLIC_STRIPE_PRICE_PREMIUM
Old Value: price_1SAfAzA5S8NBMyaJe432bhP1 (test)
New Value: [Same live price ID]
Target: Production

Variable: STRIPE_PRICE_PRO / NEXT_PUBLIC_STRIPE_PRICE_PRO
Old Value: price_1SAfkcA5S8NBMyaJ0vq40DL0 (test)
New Value: [Live price ID from Step 3]
Target: Production

Variable: STRIPE_PRICE_INDUSTRY_BASIC / NEXT_PUBLIC_STRIPE_PRICE_INDUSTRY_BASIC
Old Value: price_1SAfknA5S8NBMyaJZ60tkxRZ (test)
New Value: [Live price ID from Step 3]
Target: Production

Variable: STRIPE_PRICE_INDUSTRY_PREMIUM / NEXT_PUBLIC_STRIPE_PRICE_INDUSTRY_PREMIUM
Old Value: price_1SAfl2A5S8NBMyaJfbGJNWch (test)
New Value: [Live price ID from Step 3]
Target: Production

Variable: STRIPE_PRICE_BASIC
Old Value: price_1SAfAzA5S8NBMyaJe432bhP1 (test)
New Value: [Same as STRIPE_PRICE_PREMIUM live value]
Target: Production
```

#### Option B: Via Vercel CLI (Bulk Update Script)

```bash
#!/bin/bash
# update-stripe-live-keys.sh

# REPLACE THESE WITH YOUR ACTUAL LIVE VALUES FROM PREVIOUS STEPS
LIVE_SECRET_KEY="sk_live_..."
LIVE_PUBLISHABLE_KEY="pk_live_..."
LIVE_WEBHOOK_SECRET="whsec_..."
LIVE_PRICE_PREMIUM="price_..."
LIVE_PRICE_PRO="price_..."
LIVE_PRICE_INDUSTRY_BASIC="price_..."
LIVE_PRICE_INDUSTRY_PREMIUM="price_..."

VERCEL_TOKEN="jbEiCVV9SMdkQ4wuje0QPyKI"
PROJECT_ID="prj_SX5KhBL3qFjQXXKJNW4KpkQNkp4D"
TEAM_ID="team_6D9m4BT4hbdjS6LVMtUBMenW"

echo "Updating Stripe Live Keys in Vercel..."

# Update secret key
curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?upsert=true&teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"STRIPE_SECRET_KEY\",\"value\":\"$LIVE_SECRET_KEY\",\"type\":\"encrypted\",\"target\":[\"production\"]}"

# Update publishable key
curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?upsert=true&teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\",\"value\":\"$LIVE_PUBLISHABLE_KEY\",\"type\":\"plain\",\"target\":[\"production\"]}"

# Update webhook secret
curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?upsert=true&teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"STRIPE_WEBHOOK_SECRET\",\"value\":\"$LIVE_WEBHOOK_SECRET\",\"type\":\"encrypted\",\"target\":[\"production\"]}"

# Update price IDs (both prefixed and non-prefixed versions)
curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?upsert=true&teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"STRIPE_PRICE_PREMIUM\",\"value\":\"$LIVE_PRICE_PREMIUM\",\"type\":\"encrypted\",\"target\":[\"production\"]}"

curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?upsert=true&teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"NEXT_PUBLIC_STRIPE_PRICE_PREMIUM\",\"value\":\"$LIVE_PRICE_PREMIUM\",\"type\":\"plain\",\"target\":[\"production\"]}"

curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?upsert=true&teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"STRIPE_PRICE_PRO\",\"value\":\"$LIVE_PRICE_PRO\",\"type\":\"encrypted\",\"target\":[\"production\"]}"

curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?upsert=true&teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"NEXT_PUBLIC_STRIPE_PRICE_PRO\",\"value\":\"$LIVE_PRICE_PRO\",\"type\":\"plain\",\"target\":[\"production\"]}"

curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?upsert=true&teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"STRIPE_PRICE_INDUSTRY_BASIC\",\"value\":\"$LIVE_PRICE_INDUSTRY_BASIC\",\"type\":\"encrypted\",\"target\":[\"production\"]}"

curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?upsert=true&teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"NEXT_PUBLIC_STRIPE_PRICE_INDUSTRY_BASIC\",\"value\":\"$LIVE_PRICE_INDUSTRY_BASIC\",\"type\":\"plain\",\"target\":[\"production\"]}"

curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?upsert=true&teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"STRIPE_PRICE_INDUSTRY_PREMIUM\",\"value\":\"$LIVE_PRICE_INDUSTRY_PREMIUM\",\"type\":\"encrypted\",\"target\":[\"production\"]}"

curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?upsert=true&teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"NEXT_PUBLIC_STRIPE_PRICE_INDUSTRY_PREMIUM\",\"value\":\"$LIVE_PRICE_INDUSTRY_PREMIUM\",\"type\":\"plain\",\"target\":[\"production\"]}"

curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?upsert=true&teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"STRIPE_PRICE_BASIC\",\"value\":\"$LIVE_PRICE_PREMIUM\",\"type\":\"encrypted\",\"target\":[\"production\"]}"

echo "Done! Redeploy your Vercel project for changes to take effect."
```

**Usage**:

```bash
chmod +x update-stripe-live-keys.sh
./update-stripe-live-keys.sh
```

---

### Phase 4: Deploy and Test

#### Step 1: Redeploy Vercel Production

```bash
# Environment variable changes require a redeploy
vercel --prod

# Or via Vercel Dashboard:
# Go to: https://vercel.com/ottopens-projects/ottopen/deployments
# Click "Redeploy" on latest production deployment
```

#### Step 2: Verify Webhook Connectivity

```bash
# Test webhook from Stripe dashboard
# Go to: https://dashboard.stripe.com/webhooks
# Click your webhook endpoint
# Click "Send test webhook"
# Select event: customer.subscription.created
# Click "Send test webhook"

# Check Vercel logs to confirm webhook received:
vercel logs --prod
```

#### Step 3: Test with Real Payment (Small Amount)

```
IMPORTANT: Use a REAL credit card now (test cards won't work in live mode)

1. Go to: https://ottopen.app/pricing
2. Select "Premium Features" ($20/mo - smallest amount)
3. Enter real card details
4. Complete checkout
5. Verify:
   ☐ Payment succeeded in Stripe Dashboard
   ☐ Webhook event received (check Vercel logs)
   ☐ User subscription tier updated in Supabase
   ☐ User can access premium features

6. Cancel the subscription immediately if this was just a test:
   - Stripe Dashboard → Customers → Find customer → Subscriptions → Cancel
```

**⚠️ WARNING**: You will be charged real money for live mode tests. Use your smallest tier.

---

## Maintenance Strategy

### Keep Test and Live in Sync

**Recommended Workflow**:

1. Always test new features in Test Mode first
2. Use Preview deployments with test keys
3. Only update Live Mode after thorough testing
4. Document any changes to products/prices in this guide

### Monitoring Live Mode

**Set up alerts** for:

```
☐ Failed webhook deliveries (Stripe Dashboard → Webhooks → Alerts)
☐ Failed payments (Stripe Dashboard → Settings → Notifications)
☐ Unusual subscription cancellation rates
☐ Stripe balance alerts (when payouts are ready)
```

### Backup Price IDs

Keep a record of your live price IDs in a secure location:

```
# Store in 1Password/LastPass or equivalent:
Live Price IDs:
- Premium: price_...
- Pro: price_...
- Industry Basic: price_...
- Industry Premium: price_...
```

---

## Rollback Plan

If something goes wrong after going live:

### Immediate Actions

```bash
# 1. Quickly switch back to test keys in Vercel
vercel env rm STRIPE_SECRET_KEY production
vercel env add STRIPE_SECRET_KEY production
# Enter your test key: sk_test_...

# 2. Redeploy immediately
vercel --prod

# 3. Put up maintenance page if needed
# (or temporarily disable pricing page)
```

### Investigation

1. Check Stripe Dashboard → Developers → Events for errors
2. Check Vercel logs for webhook failures
3. Check Supabase logs for database issues
4. Review recent code changes

---

## FAQ

### Q: Can I use both test and live mode simultaneously?

**A**: Yes! Use test keys in Preview/Development environments and live keys only in Production.

### Q: Will my test customers carry over?

**A**: No, test and live data are completely separate.

### Q: Do I need to recreate Stripe Connect accounts?

**A**: Yes, if you're using Stripe Connect, connected accounts must also be created in live mode.

### Q: How do I test live mode without charging myself?

**A**: Create a subscription and immediately cancel it to get a prorated refund, or create a 100% discount coupon.

### Q: What if I need to change prices after going live?

**A**: Create new prices (don't edit existing ones). Update env vars with new price IDs and redeploy.

### Q: How long does Stripe account activation take?

**A**: Usually 1-3 business days, but can take up to a week for complex businesses.

---

## Checklist: Complete Transition

**Phase 1: Preparation**

- [ ] Stripe account fully activated
- [ ] Bank account added for payouts
- [ ] Identity verification completed
- [ ] Test mode thoroughly tested

**Phase 2: Live Resources**

- [ ] Switched to Live mode in Stripe Dashboard
- [ ] Copied live API keys (secret and publishable)
- [ ] Created 7 products in live mode
- [ ] Created 7 prices in live mode
- [ ] Saved all live price IDs
- [ ] Created live webhook endpoint
- [ ] Saved live webhook secret

**Phase 3: Environment Variables**

- [ ] Updated STRIPE_SECRET_KEY in Vercel
- [ ] Updated NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Vercel
- [ ] Updated STRIPE_WEBHOOK_SECRET in Vercel
- [ ] Updated all 5 price ID variables (both prefixed and non-prefixed)

**Phase 4: Testing**

- [ ] Redeployed Vercel production
- [ ] Tested webhook connectivity
- [ ] Completed real payment test
- [ ] Verified subscription in Supabase
- [ ] Cancelled test subscription
- [ ] Set up Stripe alerts

**Documentation**

- [ ] Backed up live price IDs securely
- [ ] Updated internal documentation
- [ ] Informed team of live mode status

---

## Current Status Summary

**Test Mode Configuration** (As of Dec 13, 2025):

```
Account: acct_1SAf2tA5S8NBMyaJ
Products: 7 created
Webhook: we_1SI1GqA5S8NBMyaJuiUPALHR (configured for https://ottopen.app)
Status: ✅ Fully functional in test mode
```

**Next Steps**:

1. Complete Stripe account activation
2. Follow Phase 2-4 of this guide when ready to accept real payments
3. Estimated transition time: 2-4 hours (plus Stripe verification wait time)

---

**Last Updated**: December 13, 2025
**Maintained By**: Development Team
**Questions**: Refer to Stripe documentation or contact support
