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
      .select('id, stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    if (error || !user?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`
    const stripe = getStripe()

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${origin}/settings/billing`,
    })

    return NextResponse.json({ url: portal.url }, { status: 200 })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
