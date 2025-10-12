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
      .select('id, stripe_connect_account_id')
      .eq('id', userId)
      .single()

    if (error || !user?.stripe_connect_account_id) {
      return NextResponse.json({ error: 'No Connect account found' }, { status: 404 })
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`

    const stripe = getStripe()
    const link = await stripe.accountLinks.create({
      account: user.stripe_connect_account_id,
      refresh_url: `${origin}/connect/onboarding?refresh=1`,
      return_url: `${origin}/connect/onboarding/completed`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: link.url }, { status: 200 })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to create account link' }, { status: 500 })
  }
}
