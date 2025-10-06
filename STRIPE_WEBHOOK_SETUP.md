# Ottopen - Stripe Webhook Configuration

## Webhook Endpoint Created ✅

**Date:** January 26, 2025

### Production Webhook Details

- **App:** Ottopen
- **Endpoint URL:** `https://script-soiree-main.vercel.app/api/webhooks/stripe`
- **Webhook ID:** `we_1SFHImBCmYmRaOfbmQAF5JvX`
- **Webhook Secret:** `whsec_jVfHCArbnni3n7X2A5EG8L2YAQm903qi`
- **Status:** Enabled
- **Mode:** Test Mode (for development)

### Enabled Events

The webhook listens for the following Stripe events:

1. **Subscription Events:**
   - `customer.subscription.created` - New subscription created
   - `customer.subscription.updated` - Subscription modified
   - `customer.subscription.deleted` - Subscription cancelled

2. **Account Events:**
   - `account.updated` - Stripe Connect account updates

3. **Payment Events (NEW):**
   - `payment_intent.succeeded` - Successful payment (logs to security_events)
   - `payment_intent.payment_failed` - Failed payment (logs with risk score)
   - `charge.dispute.created` - Chargeback/dispute filed (high-risk alert)

### Environment Variables

The webhook secret has been added to Vercel in all environments:

```bash
STRIPE_WEBHOOK_SECRET=whsec_jVfHCArbnni3n7X2A5EG8L2YAQm903qi
```

**Environments configured:**

- ✅ Production
- ✅ Preview
- ✅ Development

### What the Webhook Does

#### 1. Subscription Management

- Creates/updates user subscription tiers
- Processes referral confirmations
- Handles subscription cancellations

#### 2. Payment Tracking (NEW)

- Logs successful payments to `security_events` table
- Records failed payments with risk scoring
- Tracks disputes for fraud detection

#### 3. Audit Logging (NEW)

- All webhook events logged to `webhook_events` table
- Security events tracked in `security_events` table
- Admin actions recorded in `admin_actions` table

### Testing the Webhook

#### Local Testing

```bash
# Forward Stripe events to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger charge.dispute.created
stripe trigger customer.subscription.created
```

#### Production Testing

Events from real Stripe transactions will automatically trigger the webhook.

### Monitoring

Check webhook deliveries in Stripe Dashboard:
https://dashboard.stripe.com/test/webhooks/we_1SFHImBCmYmRaOfbmQAF5JvX

### Security Features

1. **Signature Verification:** All webhooks verified using HMAC signature
2. **Replay Attack Prevention:** Events older than 5 minutes rejected
3. **Error Logging:** All errors logged without exposing sensitive data
4. **Event Logging:** All webhook events stored for audit trail

### Next Steps for Production

When ready to go live:

1. Create a live mode webhook endpoint:

   ```bash
   stripe webhook_endpoints create --live \
     -d url="https://script-soiree-main.vercel.app/api/webhooks/stripe" \
     -d "enabled_events[0]=customer.subscription.created" \
     # ... add all events
   ```

2. Update `STRIPE_WEBHOOK_SECRET` in Vercel with the live webhook secret

3. Update `STRIPE_SECRET_KEY` with live mode key

4. Test thoroughly in production mode

### Related Files

- Webhook Handler: `/app/api/webhooks/stripe/route.ts`
- Database Migrations:
  - `/supabase/migrations/20250121000000_comprehensive_audit_logging.sql`
  - `/supabase/migrations/20250119000000_dmca_takedown_system.sql`

### Support

For webhook issues:

1. Check Vercel deployment logs
2. Review Stripe webhook delivery logs
3. Check Supabase logs for database errors
4. Review `webhook_events` table for event history
