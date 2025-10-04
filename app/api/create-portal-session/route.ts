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

export async function POST(request: NextRequest) {
  try {
    // SEC-FIX: Require authentication
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Stripe is properly configured
    if (!stripe) {
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    // SEC-FIX: Get customer ID from authenticated user's record, not request body
    const supabase = createServerSupabaseClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, email, username')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      logError(userError, { context: 'create_portal_session', userId: user.id })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let stripeCustomerId = userData.stripe_customer_id

    // If no customer ID exists, create a new customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.username || undefined,
        metadata: {
          user_id: user.id,
        },
      })

      stripeCustomerId = customer.id

      // Update user record with stripe_customer_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)

      if (updateError) {
        logError(updateError, { context: 'update_stripe_customer_id', userId: user.id })
        // Continue anyway - customer was created in Stripe
      }
    }

    // Create a portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?tab=subscription`,
    })

    return NextResponse.json({
      url: session.url,
    })
  } catch (error) {
    logError(error, { context: 'create_portal_session' })
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
