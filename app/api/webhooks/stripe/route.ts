import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/src/lib/supabase-admin'
import { logError } from '@/src/lib/errors'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  })
}

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 * SEC-002: Enhanced webhook signature validation
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  // Validate webhook secret configuration
  if (!webhookSecret || webhookSecret.length < 32) {
    logError(new Error('Invalid webhook secret configuration'))
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    // SEC-002: Prevent replay attacks - check event age
    const eventAge = Date.now() - event.created * 1000
    if (eventAge > 5 * 60 * 1000) {
      // 5 minutes
      logError(new Error('Webhook event too old'), {
        eventId: event.id,
        eventAge: eventAge / 1000,
      })
      return NextResponse.json({ error: 'Event expired' }, { status: 401 })
    }
  } catch (error: unknown) {
    // SEC-002: Don't leak error details to potential attackers
    logError(error, { context: 'webhook_signature_validation' })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabaseAdmin)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabaseAdmin)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account, supabaseAdmin)
        break

      default:
        // Log unhandled event types for monitoring
        logError(new Error('Unhandled webhook event type'), { eventType: event.type })
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    logError(error, { context: 'webhook_processing', eventType: event.type })
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

/**
 * Handle subscription creation/update
 * Confirm referral when user subscribes
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabaseAdmin: any) {
  try {
    const customerId = subscription.customer as string
    const referralCode = subscription.metadata?.referral_code

    // Find user by Stripe customer ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, account_tier')
      .eq('stripe_customer_id', customerId)
      .single()

    if (userError || !user) {
      logError(new Error('User not found for Stripe customer'), { customerId })
      return
    }

    // Determine subscription tier from price
    let tier = 'premium'
    const amount = subscription.items.data[0]?.price?.unit_amount || 0

    if (subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id
      // Map price IDs to tiers (you'll need to set these based on your actual price IDs)
      const tierMap: Record<string, string> = {
        [process.env.STRIPE_PRICE_PREMIUM || '']: 'premium',
        [process.env.STRIPE_PRICE_PRO || '']: 'pro',
        [process.env.STRIPE_PRICE_INDUSTRY_BASIC || '']: 'industry_basic',
        [process.env.STRIPE_PRICE_INDUSTRY_PREMIUM || '']: 'industry_premium',
      }
      tier = tierMap[priceId] || 'premium'
    }

    // Update user tier
    await supabaseAdmin.from('users').update({ account_tier: tier }).eq('id', user.id)

    // Check for pending referral OR use referral code from metadata
    let referral = null

    if (referralCode) {
      // Find referral by code
      const { data } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('code', referralCode)
        .eq('referred_id', user.id)
        .eq('status', 'pending')
        .single()
      referral = data
    } else {
      // Check for existing pending referral
      const { data } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('referred_id', user.id)
        .eq('status', 'pending')
        .single()
      referral = data
    }

    if (referral) {
      console.log('Confirming referral and creating earnings for user:', user.id)

      // Confirm referral
      await supabaseAdmin
        .from('referrals')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', referral.id)

      // Calculate commission (20% of subscription amount)
      const commissionAmount = Math.floor(amount * 0.2)

      // Create referral earnings record
      const { error: earningsError } = await supabaseAdmin.from('referral_earnings').insert({
        referrer_id: referral.referrer_id,
        referred_id: user.id,
        referral_id: referral.id,
        amount: commissionAmount,
        currency: subscription.items.data[0]?.price?.currency || 'usd',
        subscription_tier: tier,
        status: 'pending',
        stripe_subscription_id: subscription.id,
        stripe_payment_intent_id: subscription.latest_invoice as string,
      })

      if (earningsError) {
        console.error('Failed to create referral earnings:', earningsError)
      } else {
        console.log('Created referral earnings:', commissionAmount, 'cents')
      }
    }
  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabaseAdmin: any) {
  try {
    const customerId = subscription.customer as string

    // Find user by Stripe customer ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!user) {
      logError(new Error('User not found for Stripe customer'), { customerId })
      return
    }

    // Downgrade to free tier
    await supabaseAdmin.from('users').update({ account_tier: 'free' }).eq('id', user.id)

    logError(new Error('Subscription cancelled'), { userId: user.id })
  } catch (error: unknown) {
    logError(error, { context: 'handleSubscriptionDeleted' })
  }
}

/**
 * Handle Stripe Connect account updates
 */
async function handleAccountUpdated(account: Stripe.Account, supabaseAdmin: any) {
  try {
    const userId = account.metadata?.user_id

    if (!userId) {
      logError(new Error('No user_id in account metadata'))
      return
    }

    const onboarded = account.details_submitted || false
    const chargesEnabled = account.charges_enabled || false
    const payoutsEnabled = account.payouts_enabled || false

    // Update user record
    await supabaseAdmin
      .from('users')
      .update({
        stripe_connect_onboarded: onboarded,
        stripe_connect_charges_enabled: chargesEnabled,
        stripe_connect_payouts_enabled: payoutsEnabled,
      })
      .eq('id', userId)

    logError(new Error('Updated Connect status'), { userId })
  } catch (error: unknown) {
    logError(error, { context: 'handleAccountUpdated' })
  }
}
