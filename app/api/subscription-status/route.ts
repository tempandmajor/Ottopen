import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerUser } from '@/lib/server/auth'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { logError } from '@/src/lib/errors'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Check if Stripe is configured
const isStripeConfigured = () => {
  return !!process.env.STRIPE_SECRET_KEY
}

const stripe = isStripeConfigured()
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    })
  : null

const emptySubscriptionResponse = {
  status: 'none',
  planName: '',
  amount: 0,
  currency: 'usd',
  interval: '',
  currentPeriodEnd: '',
  cancelAtPeriodEnd: false,
}

export async function GET(request: NextRequest) {
  try {
    // SEC-FIX: Require authentication
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Stripe is properly configured
    if (!stripe) {
      return NextResponse.json(emptySubscriptionResponse)
    }

    // SEC-FIX: Get customer ID from authenticated user's record, not query params
    const supabase = createServerSupabaseClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      logError(userError, { context: 'subscription_status', userId: user.id })
      return NextResponse.json(emptySubscriptionResponse)
    }

    const customerId = userData.stripe_customer_id

    if (!customerId) {
      return NextResponse.json(emptySubscriptionResponse)
    }

    // Get active subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json(emptySubscriptionResponse)
    }

    const subscription = subscriptions.data[0]
    const price = subscription.items.data[0]?.price

    return NextResponse.json({
      status: subscription.status,
      planName: 'Premium Features',
      amount: price?.unit_amount || 0,
      currency: price?.currency || 'usd',
      interval: price?.recurring?.interval || '',
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    })
  } catch (error) {
    logError(error, { context: 'subscription_status' })
    return NextResponse.json(emptySubscriptionResponse)
  }
}
