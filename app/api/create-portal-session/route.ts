import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { logError } from '@/src/lib/errors'
import { getStripe, assertStripeEnv } from '@/src/lib/stripe'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// DEPRECATED: This endpoint is deprecated in favor of /api/stripe/create-portal-session
// It remains for backward compatibility but will be removed in a future version

export async function POST(request: NextRequest) {
  try {
    assertStripeEnv()
    const stripe = getStripe()

    // SEC-FIX: Require authentication
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
