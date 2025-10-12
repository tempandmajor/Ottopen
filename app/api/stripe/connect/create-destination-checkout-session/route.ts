import { NextRequest, NextResponse } from 'next/server'
import { getStripe, assertStripeEnv, calcApplicationFeeAmount } from '@/src/lib/stripe'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import * as Sentry from '@sentry/nextjs'

// Creates a Stripe Checkout Session that charges the buyer on the platform account
// and transfers net funds to the seller's connected account (destination charge)
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

    const body = (await req.json().catch(() => ({}))) as {
      sellerUserId?: string
      amountCents?: number
      currency?: string
      description?: string
    }

    const sellerUserId = (body.sellerUserId || '').trim()
    const amountCents = Number(body.amountCents || 0)
    const currency = (body.currency || 'usd').toLowerCase()
    const description = body.description || 'Purchase'

    // Basic validations
    if (!sellerUserId) return NextResponse.json({ error: 'Missing sellerUserId' }, { status: 400 })
    if (!Number.isFinite(amountCents) || amountCents < 100 || amountCents > 5000000) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Fetch seller to confirm Connect account and capabilities
    const { data: seller, error: sellerErr } = await supabase
      .from('users')
      .select('id, stripe_connect_account_id, stripe_connect_charges_enabled')
      .eq('id', sellerUserId)
      .single()
    if (sellerErr || !seller?.stripe_connect_account_id) {
      return NextResponse.json({ error: 'Seller not onboarded to Stripe Connect' }, { status: 400 })
    }
    if (!seller.stripe_connect_charges_enabled) {
      return NextResponse.json(
        { error: 'Seller is not enabled to receive charges' },
        { status: 400 }
      )
    }

    // Ensure buyer has a Stripe customer
    const { data: buyer, error: buyerErr } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('id', session.user.id)
      .single()
    if (buyerErr || !buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })

    const stripe = getStripe()
    let customerId = buyer.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        metadata: { user_id: buyer.id },
      })
      customerId = customer.id
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', buyer.id)
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`

    const applicationFee = calcApplicationFeeAmount(amountCents)

    const checkout = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: amountCents,
              product_data: { name: description },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/transactions/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/transactions/cancelled`,
        payment_intent_data: {
          application_fee_amount: applicationFee,
          transfer_data: { destination: seller.stripe_connect_account_id },
        },
        metadata: {
          buyer_user_id: buyer.id,
          seller_user_id: seller.id,
        },
      },
      { idempotencyKey: `dest-checkout:${buyer.id}:${seller.id}:${amountCents}:${currency}` }
    )

    return NextResponse.json({ url: checkout.url }, { status: 200 })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to create destination checkout session' },
      { status: 500 }
    )
  }
}
