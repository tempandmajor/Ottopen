import { NextRequest, NextResponse } from 'next/server'
import { getStripe, assertStripeEnv } from '@/src/lib/stripe'
import { getSupabaseAdmin } from '@/src/lib/supabase-admin'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'

// Stripe sends signed events; we must verify against the raw body
export async function POST(req: NextRequest) {
  let body: string
  try {
    assertStripeEnv()
    body = await req.text()
  } catch (e) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) return new NextResponse('Missing signature', { status: 400 })

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    const admin = getSupabaseAdmin()

    // Idempotency: record processed event IDs
    const id = event.id
    const { data: existing } = await admin
      .from('stripe_events')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        // If subscription, update user's subscription fields
        if (session.mode === 'subscription') {
          const customer = session.customer as string
          // Find user by stripe_customer_id
          const { data: users } = await admin
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customer)
            .limit(1)
          const user = users?.[0]
          if (user) {
            // Fetch subscription details
            if (session.subscription) {
              const sub: any = await stripe.subscriptions.retrieve(session.subscription as string)
              await admin
                .from('users')
                .update({
                  subscription_status: sub.status,
                  subscription_tier:
                    (sub.items?.data?.[0]?.price?.nickname || sub.items?.data?.[0]?.price?.id) ??
                    null,
                  subscription_current_period_end: sub.current_period_end
                    ? new Date(sub.current_period_end * 1000).toISOString()
                    : null,
                })
                .eq('id', user.id)
            }
          }
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any
        const customer = sub.customer as string
        const { data: users } = await admin
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customer)
          .limit(1)
        const user = users?.[0]
        if (user) {
          await admin
            .from('users')
            .update({
              subscription_status: sub.status,
              subscription_tier:
                (sub.items?.data?.[0]?.price?.nickname || sub.items?.data?.[0]?.price?.id) ?? null,
              subscription_current_period_end: sub.current_period_end
                ? new Date(sub.current_period_end * 1000).toISOString()
                : null,
            })
            .eq('id', user.id)
        }
        break
      }
      case 'account.updated': {
        // Connected account capability updates
        const acct = event.data.object as any
        const accountId = acct.id as string
        const chargesEnabled = !!acct.charges_enabled
        const payoutsEnabled = !!acct.payouts_enabled
        const detailsSubmitted = !!acct.details_submitted
        await admin
          .from('users')
          .update({
            stripe_connect_onboarded: detailsSubmitted,
            stripe_connect_charges_enabled: chargesEnabled,
            stripe_connect_payouts_enabled: payoutsEnabled,
          })
          .eq('stripe_connect_account_id', accountId)
        break
      }
      default:
        // No-op
        break
    }

    // Mark event processed
    await admin.from('stripe_events').insert({ id: event.id }).select()

    return NextResponse.json({ received: true })
  } catch (err) {
    Sentry.captureException(err)
    return new NextResponse(`Webhook Error`, { status: 400 })
  }
}
