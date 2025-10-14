import { NextRequest, NextResponse } from 'next/server'
import { getStripe, assertStripeEnv } from '@/src/lib/stripe'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: NextRequest) {
  try {
    assertStripeEnv()

    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const stripe = getStripe()
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`

    // Create Stripe customer if they don't have one
    let customerId = user.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email || user.email || undefined,
        metadata: { user_id: user.id },
      })
      customerId = customer.id

      // Update user record with stripe_customer_id
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/settings?tab=subscription`,
    })

    return NextResponse.json({ url: portal.url }, { status: 200 })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
