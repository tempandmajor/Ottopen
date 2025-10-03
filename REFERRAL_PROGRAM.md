# Cash Referral Program Implementation

## Overview

Implemented a complete cash-based referral program where users earn $2 for each referred user who becomes a paying subscriber. Payouts are handled via Stripe Connect.

## Features Implemented

### 1. Database Schema

- **Migration**: `supabase/migrations/20250110000000_add_cash_referral_system.sql`
- Added Stripe Connect fields to users table:
  - `stripe_connect_account_id`
  - `stripe_connect_onboarded`
  - `stripe_connect_charges_enabled`
  - `stripe_connect_payouts_enabled`

- **New Tables**:
  - `referral_earnings`: Track cash earnings per referral
  - `payout_requests`: Track payout requests and status

- **Database Function**: `get_referral_balance()` - Calculate user's total, available, pending, and paid earnings

- **TypeScript Types** (in `src/lib/supabase.ts`):
  - `ReferralEarning`
  - `PayoutRequest`
  - `ReferralBalance`

### 2. API Endpoints

#### Referral Management

- `POST /api/referrals/generate` - Generate unique referral code
- `POST /api/referrals/track` - Track new referral sign-up
- `POST /api/referrals/confirm` - Confirm referral when they subscribe
- `GET /api/referrals/stats` - Get referral statistics
- `GET /api/referrals/earnings` - Get earnings and balance

#### Stripe Connect

- `POST /api/stripe/connect/onboard` - Start Stripe Connect onboarding
- `GET /api/stripe/connect/status` - Check Connect account status
- `POST /api/stripe/connect/dashboard` - Get Stripe Express Dashboard link

#### Payouts

- `POST /api/referrals/payout` - Request payout (minimum $10)
- `GET /api/referrals/payout` - Get payout history

#### Webhooks

- `POST /api/webhooks/stripe` - Handle Stripe events:
  - `customer.subscription.created` - Confirm referral
  - `customer.subscription.updated` - Update tier
  - `customer.subscription.deleted` - Downgrade user
  - `account.updated` - Update Connect status

### 3. User Interface

#### Earnings Dashboard Component

- **File**: `src/components/referrals/earnings-dashboard.tsx`
- Displays:
  - Total earned, available, pending, and paid out balances
  - Stripe Connect onboarding status
  - Request payout button (enabled when balance ≥ $10)
  - Earnings history with referral details
  - Payout history

#### Updated Referrals Page

- **File**: `app/referrals/ReferralsView.tsx`
- Added "Earnings" tab to main referrals page
- Updated reward structure to show $2 cash per referral
- Updated "How It Works" to reflect cash earnings
- Changed from subscription credits to cash payouts

### 4. Workflow

#### For Referrers:

1. Generate referral code (`/api/referrals/generate`)
2. Share referral link
3. Track when someone signs up with their code
4. Earn $2 when referral becomes paying subscriber
5. Complete Stripe Connect onboarding
6. Request payout when balance reaches $10
7. Receive funds via Stripe transfer (1-3 business days)

#### For Referred Users:

1. Sign up using referral code
2. Referral tracked as "pending" in database
3. When they subscribe, referral confirmed
4. Referrer's earnings marked as "available"

#### Automatic Processing:

1. Stripe webhook receives `customer.subscription.created`
2. Find user by `stripe_customer_id`
3. Check for pending referral
4. Confirm referral and update earnings to "available"
5. Check for milestone achievements (5, 10, 25, 50 referrals)

### 5. Key Constants

- **Earnings per referral**: $2.00 (200 cents)
- **Minimum payout**: $10.00 (1000 cents)
- **Currency**: USD
- **Payout method**: Stripe Connect transfers

## Environment Variables Required

Add these to your `.env.local`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Connect (optional, for pricing)
STRIPE_PRICE_PREMIUM=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_INDUSTRY_BASIC=price_...
STRIPE_PRICE_INDUSTRY_PREMIUM=price_...

# Supabase (for webhooks)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App URL (for webhooks and redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup Instructions

### 1. Run Database Migration

```bash
# Apply migration to add new tables and fields
supabase db push
```

### 2. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `account.updated`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 3. Test Stripe Connect Onboarding

1. Navigate to `/referrals` → "Earnings" tab
2. Click "Start Onboarding"
3. Complete Stripe Express onboarding flow
4. Return to app, status should update automatically

### 4. Test End-to-End Flow

1. User A generates referral code
2. User B signs up with referral code
3. User B subscribes to paid plan
4. Stripe webhook confirms referral
5. User A sees $2 in earnings
6. User A completes Stripe Connect
7. User A requests payout when balance ≥ $10

## Database Triggers

### `mark_earnings_available()`

- Automatically marks earnings as "available" when referral status changes to "confirmed"
- Triggered by updates to `referrals` table

### `update_updated_at_column()`

- Updates `updated_at` timestamp on record changes
- Applied to `referral_earnings` and `payout_requests` tables

## Security Considerations

1. **Row Level Security (RLS)**: All tables have RLS policies
2. **Server-side validation**: All earnings/payout operations use Supabase admin client
3. **Stripe webhook verification**: Signature validation on all webhook events
4. **Minimum payout**: $10 threshold prevents abuse
5. **One-time earnings**: Each referral can only be credited once

## Testing Checklist

- [ ] Generate referral code
- [ ] Track referral sign-up
- [ ] Confirm referral on subscription
- [ ] View earnings dashboard
- [ ] Complete Stripe Connect onboarding
- [ ] Request payout
- [ ] Verify Stripe transfer created
- [ ] Test webhook events (subscription created/deleted)
- [ ] Test milestone achievements
- [ ] Verify RLS policies work correctly

## Future Enhancements

- [ ] Add referral leaderboard
- [ ] Email notifications for earnings/payouts
- [ ] Multi-currency support
- [ ] Tiered commission rates based on referral count
- [ ] Referral analytics dashboard
- [ ] Tax reporting (1099 generation)
