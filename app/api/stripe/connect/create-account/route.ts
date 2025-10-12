import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { getStripe, assertStripeEnv } from '@/src/lib/stripe'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: NextRequest) {
  try {
    assertStripeEnv()

    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, stripe_connect_account_id')
      .eq('id', userId)
      .single()

    if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const stripe = getStripe()

    if (user.stripe_connect_account_id) {
      return NextResponse.json({ accountId: user.stripe_connect_account_id }, { status: 200 })
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email: session.user.email || undefined,
      business_type: 'individual',
      metadata: { user_id: userId },
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    })

    await supabase
      .from('users')
      .update({ stripe_connect_account_id: account.id, stripe_connect_onboarded: false })
      .eq('id', userId)

    return NextResponse.json({ accountId: account.id }, { status: 200 })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to create Connect account' }, { status: 500 })
  }
}
