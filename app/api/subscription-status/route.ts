import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

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

export async function GET(request: NextRequest) {
  try {
    // Check if Stripe is properly configured
    if (!stripe) {
      return NextResponse.json({
        status: 'none',
        planName: '',
        amount: 0,
        currency: 'usd',
        interval: '',
        currentPeriodEnd: '',
        cancelAtPeriodEnd: false,
      })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({
        status: 'none',
        planName: '',
        amount: 0,
        currency: 'usd',
        interval: '',
        currentPeriodEnd: '',
        cancelAtPeriodEnd: false,
      })
    }

    // Get active subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({
        status: 'none',
        planName: '',
        amount: 0,
        currency: 'usd',
        interval: '',
        currentPeriodEnd: '',
        cancelAtPeriodEnd: false,
      })
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
    console.error('Error fetching subscription status:', error)
    return NextResponse.json({
      status: 'none',
      planName: '',
      amount: 0,
      currency: 'usd',
      interval: '',
      currentPeriodEnd: '',
      cancelAtPeriodEnd: false,
    })
  }
}
