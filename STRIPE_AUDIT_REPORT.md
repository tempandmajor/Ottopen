# 🔍 Stripe Implementation Audit Report

**Project:** Ottopen (Script Soiree)
**Date:** January 3, 2025
**Stripe Account:** acct_1SAf2tA5S8NBMyaJ (Ottopen sandbox)
**Supabase Project:** wkvatudgffosjfwqyxgt (Ottopen)

---

## Executive Summary

✅ **Overall Status: FUNCTIONAL with CRITICAL SECURITY ISSUES**

The Stripe integration is functionally complete with subscription management and a cash referral system. However, there are **critical security vulnerabilities** and **missing implementation components** that must be addressed before production deployment.

### Key Findings:

- ❌ **NO CHECKOUT FLOW IMPLEMENTED** - Users cannot subscribe
- ❌ **CRITICAL: No webhook endpoint configured in Stripe**
- ⚠️ **14 security warnings from Supabase (RLS & function security)**
- ⚠️ **Module-level Stripe initialization in legacy routes (build issues)**
- ⚠️ **Missing customer creation flow**
- ✅ Referral cash system fully implemented
- ✅ Stripe Connect integration complete

---

## 🚨 Critical Issues (MUST FIX)

### 1. **NO CHECKOUT/SUBSCRIPTION FLOW** ❌

**Severity:** CRITICAL
**Impact:** Users cannot subscribe to paid plans

**Finding:**

- No `checkout.sessions.create` endpoint found
- No payment links or subscription creation flow
- Existing prices in Stripe but no way for users to purchase
- `subscription-status` route exists but no way to create subscriptions

**Products in Stripe:**

- Premium Features ($20/month)
- Writer Pro Plan ($50/month)
- External Agent Access ($200/month)
- Publisher Access ($300/month)
- Producer Premium Access ($500/month)
- Job Posting - Standard ($99 one-time)
- Job Posting - Featured ($199 one-time)

**Required Action:**

```typescript
// MISSING: app/api/checkout/route.ts
// Need to create Stripe Checkout Session for subscriptions
```

**Recommendation:** Implement using Stripe Checkout Sessions or Payment Links

---

### 2. **No Webhook Configured in Stripe** ❌

**Severity:** CRITICAL
**Impact:** Referral confirmations won't work, subscriptions won't update

**Finding:**

- Webhook handler exists at `/app/api/webhooks/stripe/route.ts`
- BUT: No webhook endpoint configured in Stripe Dashboard
- Referral system relies on webhooks to confirm earnings

**Required Events:**

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `account.updated`

**Required Action:**

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Add `STRIPE_WEBHOOK_SECRET` to environment variables

---

### 3. **Database Security Issues** ⚠️

**Severity:** HIGH
**Impact:** Data exposure, unauthorized access

**Findings from Supabase Security Advisor:**

#### A. Missing RLS Policies (10 tables):

Tables with RLS enabled but NO policies:

1. `achievements`
2. `club_activity`
3. `club_events`
4. `club_invitations`
5. `critique_submissions`
6. `critiques`
7. `discussion_replies`
8. `event_participants`
9. `reading_progress`
10. `reading_schedules`

**Impact:** These tables are effectively inaccessible to users OR completely open

#### B. Function Security Issues (13 functions):

Functions with mutable search_path (security risk):

1. `get_referral_balance` - **CRITICAL (used in referral system)**
2. `mark_earnings_available` - **CRITICAL (used in referral system)**
3. `update_updated_at_column`
4. `update_club_member_count`
5. `update_discussion_reply_count`
6. `update_critique_count`
7. `update_event_participant_count`
8. `update_script_page_count`
9. `update_user_statistics`
10. `update_character_counts`
11. `update_scripts_timestamp`
12. `calculate_writing_streak`
13. `update_application_statistics`

**Fix Required:**

```sql
-- Add to each function definition
SET search_path = public;
```

#### C. Auth Security:

- ⚠️ **Leaked password protection DISABLED**
- Should enable HaveIBeenPwned.org integration

**Remediation:** https://supabase.com/docs/guides/auth/password-security

---

## ⚠️ High Priority Issues

### 4. **Module-Level Stripe Initialization** ⚠️

**Severity:** MEDIUM
**Impact:** Build failures, environment variable issues

**Affected Files:**

- `app/api/create-portal-session/route.ts`
- `app/api/subscription-status/route.ts`

**Issue:**

```typescript
// ❌ BAD: Initialized at module level
const stripe = isStripeConfigured()
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    })
  : null
```

**Fixed in:**

- ✅ All referral routes use `getStripe()` function
- ✅ All Stripe Connect routes use `getStripe()` function

**Recommendation:** Update legacy routes to use lazy initialization pattern

---

### 5. **Missing Customer Creation Flow** ⚠️

**Severity:** MEDIUM
**Impact:** Stripe customer ID not saved to database

**Finding:**

```typescript
// app/api/create-portal-session/route.ts:45
// TODO: Update user record with stripe_customer_id
// This would require a database update call here
```

**Issue:**

- Portal session creates Stripe customer if missing
- BUT: Customer ID is NOT saved to `users.stripe_customer_id`
- Webhook relies on this field to find users

**Recommendation:**

```typescript
// Add after customer creation:
await supabase.from('users').update({ stripe_customer_id: customer.id }).eq('id', user.id)
```

---

### 6. **Referral System Issues** ⚠️

#### A. Webhook Race Condition

**File:** `app/api/webhooks/stripe/route.ts:126`

**Issue:**

```typescript
// Makes HTTP request to own API - can fail
await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/referrals/confirm`, {
  method: 'POST',
  // ...
})
```

**Risk:**

- Network failures
- Circular dependencies
- No error handling if fetch fails

**Recommendation:** Call Supabase directly instead of HTTP fetch

#### B. Earnings Creation Missing

**Severity:** HIGH
**Impact:** Referrals confirmed but NO earnings created

**Finding:**

- `referrals/confirm` route updates referral to "confirmed"
- Trigger `mark_earnings_available` updates EXISTING earnings
- BUT: No code creates initial `referral_earnings` record

**Missing Code:**

```typescript
// Should be in referrals/track or confirm route:
await supabase.from('referral_earnings').insert({
  user_id: referral.referrer_id,
  referral_id: referral.id,
  amount_cents: 200, // $2
  currency: 'usd',
  status: 'pending',
})
```

**Critical:** Referral system won't create earnings without this!

---

## ✅ Working Components

### 1. **Stripe Connect Integration** ✅

- Onboarding flow: `/api/stripe/connect/onboard`
- Status checking: `/api/stripe/connect/status`
- Dashboard access: `/api/stripe/connect/dashboard`
- Account webhook handler for status updates

### 2. **Referral Earnings System** ✅

- Database schema complete (earnings, payouts)
- Balance calculation function: `get_referral_balance()`
- Payout request API: `/api/referrals/payout`
- Earnings history API: `/api/referrals/earnings`

### 3. **Referral Core System** ✅

- Code generation: `/api/referrals/generate`
- Tracking: `/api/referrals/track`
- Stats: `/api/referrals/stats`
- Milestone tracking

### 4. **Subscription Management** ✅

- Portal session creation (with issues noted above)
- Subscription status checking
- Webhook handlers for subscription events

---

## 📊 Data Audit

### Stripe Account Status:

- **Account ID:** acct_1SAf2tA5S8NBMyaJ
- **Products:** 7 products configured
- **Prices:** 7 prices configured
- **Subscriptions:** 0 active (no checkout flow)
- **Customers:** 0 (no checkout flow)
- **Webhooks:** 0 configured ❌

### Database Status:

- **Users:** 1 user
- **Referrals:** 0
- **Referral Earnings:** 0
- **Payout Requests:** 0
- **RLS Enabled:** Yes, but policies missing on 10 tables

---

## 🔧 Required Environment Variables

Currently configured references:

```env
STRIPE_SECRET_KEY=sk_test_xxx           # ✅ Referenced
STRIPE_WEBHOOK_SECRET=whsec_xxx         # ⚠️ Referenced but no webhook
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # ✅ Referenced
NEXT_PUBLIC_APP_URL=https://...         # ✅ Referenced

# Optional (for tier mapping in webhooks):
STRIPE_PRICE_PREMIUM=price_xxx          # Referenced but optional
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_INDUSTRY_BASIC=price_xxx
STRIPE_PRICE_INDUSTRY_PREMIUM=price_xxx
```

---

## 🎯 Action Items (Priority Order)

### CRITICAL (Do First):

1. ⚠️ **Implement checkout/subscription flow**
   - Create `/api/checkout/route.ts`
   - Or use Stripe Payment Links
   - Test end-to-end subscription

2. ⚠️ **Configure Stripe webhook**
   - Add endpoint in Stripe Dashboard
   - Add `STRIPE_WEBHOOK_SECRET` to env vars
   - Test webhook delivery

3. ⚠️ **Fix earnings creation**
   - Add earnings insert in referrals/track
   - Test referral flow end-to-end

### HIGH (Do Soon):

4. Fix RLS policies for 10 tables
5. Fix function search_path security (13 functions)
6. Fix customer ID saving in portal session
7. Replace webhook fetch with direct DB call

### MEDIUM (Do Before Production):

8. Update legacy Stripe initialization (2 routes)
9. Enable leaked password protection
10. Add error handling to webhook handlers
11. Add logging for referral/earning operations

---

## 🧪 Testing Checklist

### Subscription Flow:

- [ ] User can checkout and subscribe
- [ ] Stripe customer created and saved to DB
- [ ] Webhook confirms subscription
- [ ] User tier updated in database

### Referral Flow:

- [ ] User generates referral code
- [ ] Referral tracked on signup
- [ ] Earnings created (pending)
- [ ] Webhook confirms on subscription
- [ ] Earnings marked available
- [ ] Payout request works (≥$10)
- [ ] Stripe Connect transfer succeeds

### Stripe Connect:

- [ ] Onboarding flow completes
- [ ] Status updates correctly
- [ ] Dashboard link works
- [ ] Account webhook updates user record

---

## 📚 Documentation References

- [Stripe Checkout Sessions](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Connect Transfers](https://stripe.com/docs/connect/transfers)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Security Linter](https://supabase.com/docs/guides/database/database-linter)

---

## 🎉 Summary

**What's Working:**

- Stripe Connect integration for payouts ✅
- Referral tracking and milestones ✅
- Payout request system ✅
- Database schema complete ✅

**What's Broken:**

- No way for users to subscribe ❌
- Webhook not configured ❌
- Earnings not created ❌
- 10 tables without RLS policies ❌
- 13 functions with security issues ❌

**Estimated Fix Time:** 4-6 hours for critical issues

**Risk Level:** HIGH - Do not deploy to production without fixes

---

## 🔴 UPDATED AUDIT (2025-10-12): DUPLICATE IMPLEMENTATIONS FOUND

**Updated By:** Claude Code (Post-Editor Implementation)
**New Severity:** CRITICAL - Conflicting implementations detected

### NEW CRITICAL FINDING: Two Parallel Stripe Implementations ❌

After implementing the tabbed editor enhancements, I discovered that **TWO SEPARATE STRIPE IMPLEMENTATIONS** exist in the codebase that are not coordinated:

#### Implementation #1: Original (Existing)

- File: `src/lib/stripe-connect-service.ts`
- Pattern: Service-based, escrow payments
- Database: Uses `public.profiles` table for `stripe_customer_id`
- API Routes:
  - `/api/checkout` (subscriptions)
  - `/api/create-portal-session`
  - `/api/stripe/connect/onboard`
  - `/api/stripe/connect/status`
  - `/api/stripe/connect/dashboard`

#### Implementation #2: New (Recently Added)

- File: `src/lib/stripe.ts`
- Pattern: Utility-based, destination charges
- Database: Uses `public.users` table for `stripe_customer_id`
- API Routes:
  - `/api/stripe/create-checkout-session`
  - `/api/stripe/create-portal-session`
  - `/api/stripe/connect/create-account`
  - `/api/stripe/connect/create-account-link`
  - `/api/stripe/connect/dashboard-link`
  - `/api/stripe/connect/create-destination-checkout-session`

### ❌ **CONFLICT #1: Three Different getStripe() Functions**

**Location 1** (`src/lib/stripe.ts` - NEW):

```typescript
let stripeSingleton: Stripe | null = null
export function getStripe() {
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      appInfo: { name: 'Ottopen', version: '1.0.0' },
    })
  }
  return stripeSingleton
}
```

**Location 2** (`src/lib/stripe-connect-service.ts` - OLD):

```typescript
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil', // ❌ Different version!
  })
}
```

**Location 3** (`app/api/checkout/route.ts` - OLD):

```typescript
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  })
}
```

**Impact**: Multiple Stripe instances, inconsistent API versions, no singleton enforcement

### ❌ **CONFLICT #2: Database Table Mismatch**

**Old Implementation** stores Stripe data in `profiles`:

```typescript
// app/api/checkout/route.ts
const { data: profile } = await supabase.from('profiles').select('stripe_customer_id, email')
```

**New Implementation** stores Stripe data in `users`:

```sql
-- Migration: 20251012160000_add_stripe_columns_to_users.sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
```

**Impact**:

- Subscription status updates may go to wrong table
- Existing customer data fragmented
- Webhook updates `users` but checkout checks `profiles`
- **CRITICAL**: Subscriptions will never work correctly!

### ❌ **CONFLICT #3: Duplicate API Endpoints**

| Functionality   | Old Endpoint                  | New Endpoint                              | Conflict Level |
| --------------- | ----------------------------- | ----------------------------------------- | -------------- |
| Checkout        | `/api/checkout`               | `/api/stripe/create-checkout-session`     | 🔴 CRITICAL    |
| Portal          | `/api/create-portal-session`  | `/api/stripe/create-portal-session`       | 🔴 CRITICAL    |
| Connect Onboard | `/api/stripe/connect/onboard` | `/api/stripe/connect/create-account-link` | 🟡 MEDIUM      |

**Old `/api/checkout`**:

- Uses `profiles` table
- Supports referral codes
- No price allowlisting
- Returns to `/dashboard`

**New `/api/stripe/create-checkout-session`**:

- Uses `users` table
- No referral support
- Has price allowlisting
- Different return URLs

**Impact**:

- Frontend team won't know which to use
- Different behavior for same operation
- Testing becomes impossible
- Will cause production bugs

### ❌ **CONFLICT #4: Incompatible Connect Patterns**

**Old Pattern** (Escrow for contracts):

```typescript
// src/lib/stripe-connect-service.ts
createEscrowPayment() // Hold funds
releaseEscrowPayment() // Release after approval
```

**New Pattern** (Direct destination charges):

```typescript
// create-destination-checkout-session
// Funds transfer immediately with application_fee_amount
```

**Impact**:

- Old pattern needed for marketplace contracts
- New pattern simpler but can't do escrow
- Both valid but for different use cases
- No documentation on when to use which

### 🔧 **IMMEDIATE FIXES REQUIRED**

#### Fix #1: Consolidate getStripe()

```typescript
// Use ONLY src/lib/stripe.ts version
// Update API version to match
export function getStripe() {
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil', // Match existing
      appInfo: { name: 'Ottopen', version: '1.0.0' },
    })
  }
  return stripeSingleton
}
```

#### Fix #2: Migrate Database Schema

```sql
-- Create migration: migrate_stripe_data_to_users.sql
-- Copy stripe_customer_id from profiles to users
UPDATE public.users u
SET stripe_customer_id = p.stripe_customer_id
FROM public.profiles p
WHERE u.id = p.id AND p.stripe_customer_id IS NOT NULL;

-- Update all code to use users table only
```

#### Fix #3: Deprecate Duplicate Endpoints

```typescript
// Mark old endpoints as deprecated
// app/api/checkout/route.ts
console.warn('DEPRECATED: Use /api/stripe/create-checkout-session')

// Set sunset date: 30 days
// Redirect to new endpoint
```

#### Fix #4: Document Use Cases

```markdown
# Stripe Patterns

## Direct Charges (Simple Sales)

Use: /api/stripe/connect/create-destination-checkout-session
When: Immediate transfers, simple purchases

## Escrow Charges (Contracts)

Use: stripe-connect-service.ts functions
When: Milestone payments, disputes, hold periods
```

### 📋 **UPDATED ACTION ITEMS** (DO IMMEDIATELY)

**CRITICAL PRIORITY #1**: Choose Single Database Table

- [ ] Decide: `users` table (recommended)
- [ ] Create migration script
- [ ] Update all API routes
- [ ] Test webhook updates

**CRITICAL PRIORITY #2**: Consolidate getStripe()

- [ ] Use `src/lib/stripe.ts` as canonical
- [ ] Update API version to `2025-08-27.basil`
- [ ] Remove other implementations
- [ ] Update all imports

**CRITICAL PRIORITY #3**: Deprecate Old Endpoints

- [ ] Add deprecation warnings
- [ ] Set 30-day sunset
- [ ] Update frontend to use new endpoints
- [ ] Monitor usage

**CRITICAL PRIORITY #4**: Document Both Patterns

- [ ] When to use destination charges
- [ ] When to use escrow
- [ ] Migration guide for developers

### ⚠️ **DO NOT PROCEED** Until Conflicts Resolved

**RECOMMENDATION**:

1. **HALT all new Stripe development**
2. **Schedule 2-3 day consolidation sprint**
3. **Create comprehensive test suite**
4. **Document final architecture**

**ESTIMATED EFFORT**: 2-3 days for critical consolidation

---

## Files Requiring Immediate Attention

### 🔴 Must Fix NOW:

1. `src/lib/stripe.ts` - Make canonical, update API version
2. `src/lib/stripe-connect-service.ts` - Use canonical getStripe()
3. `app/api/checkout/route.ts` - Migrate to `users` table OR deprecate
4. `app/api/stripe/create-checkout-session/route.ts` - Add referral support
5. Database migration - Move stripe\_\* from profiles to users
6. Webhook - Ensure updates match active table

### 🟡 Fix Soon:

7. All Stripe API routes - Add rate limiting
8. Fee calculation - Use comprehensive version from old implementation
9. Documentation - Create Stripe architecture guide
10. Tests - Integration tests for both patterns

---

## Conclusion: DEPLOYMENT BLOCKED

**Previous Status**: Critical issues but functional
**Current Status**: CRITICAL CONFLICTS - Multiple implementations fighting each other

**Blockers**:

1. ❌ Database table conflict (profiles vs users)
2. ❌ Duplicate endpoints with different behavior
3. ❌ Multiple Stripe client implementations
4. ❌ No clear documentation on which to use

**Action Required**:

- **DO NOT DEPLOY** current state
- **CONSOLIDATE** implementations first
- **TEST** thoroughly after consolidation
- **DOCUMENT** final architecture

**Timeline**:

- Consolidation: 2-3 days
- Testing: 1-2 days
- Documentation: 1 day
- **Total**: 4-6 days minimum

**Risk**: EXTREME - Will cause production failures if deployed as-is
