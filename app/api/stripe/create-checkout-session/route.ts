import { NextRequest, NextResponse } from 'next/server'
import { getStripe, assertStripeEnv, allowlistedPrice } from '@/src/lib/stripe'
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

    const userId = session.user.id
    const body = (await req.json().catch(() => ({}))) as {
      priceId?: string
      mode?: 'subscription' | 'payment'
      referralCode?: string
    }
    const priceId = (body.priceId || '').trim()
    const mode = body.mode || 'subscription'
    const referralCode = body.referralCode?.trim()

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })
    }
    if (mode === 'subscription' && !allowlistedPrice(priceId)) {
      return NextResponse.json({ error: 'Invalid priceId' }, { status: 400 })
    }

    // Fetch user profile to retrieve or set stripe_customer_id
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (userErr || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const stripe = getStripe()

    // Ensure Stripe Customer exists
    let customerId = user.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        metadata: { user_id: userId },
      })
      customerId = customer.id
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`

    // Build metadata with optional referral code
    const metadata: any = { user_id: userId }
    if (referralCode) {
      metadata.referral_code = referralCode
    }

    const sessionParams: any = {
      mode,
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      allow_promotion_codes: true,
      metadata,
    }

    // For subscriptions, also add referral code to subscription metadata
    if (mode === 'subscription' && referralCode) {
      sessionParams.subscription_data = { metadata }
    }

    const checkout = await stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey: `checkout:${userId}:${priceId}:${mode}`,
    })

    return NextResponse.json({ url: checkout.url }, { status: 200 })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
