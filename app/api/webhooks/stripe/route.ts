import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  })
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

// Create Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Handle subscription creation/update
 * Confirm referral when user subscribes
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
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
      console.log('User not found for customer:', customerId)
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
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string

    // Find user by Stripe customer ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!user) {
      console.log('User not found for customer:', customerId)
      return
    }

    // Downgrade to free tier
    await supabaseAdmin.from('users').update({ account_tier: 'free' }).eq('id', user.id)

    console.log('Subscription cancelled for user:', user.id)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

/**
 * Handle Stripe Connect account updates
 */
async function handleAccountUpdated(account: Stripe.Account) {
  try {
    const userId = account.metadata?.user_id

    if (!userId) {
      console.log('No user_id in account metadata')
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

    console.log('Updated Connect status for user:', userId)
  } catch (error) {
    console.error('Error handling account updated:', error)
  }
}
