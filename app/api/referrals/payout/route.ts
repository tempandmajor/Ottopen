import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import Stripe from 'stripe'

const MINIMUM_PAYOUT_CENTS = 1000 // $10 minimum payout

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  })
}

/**
 * POST /api/referrals/payout
 * Request a payout of available earnings
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount_cents } = body

    if (!amount_cents || amount_cents < MINIMUM_PAYOUT_CENTS) {
      return NextResponse.json(
        { error: `Minimum payout is $${MINIMUM_PAYOUT_CENTS / 100}` },
        { status: 400 }
      )
    }

    // Get user's Stripe Connect account
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_connect_account_id, stripe_connect_payouts_enabled')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!userData.stripe_connect_account_id || !userData.stripe_connect_payouts_enabled) {
      return NextResponse.json(
        { error: 'Please complete Stripe Connect onboarding first' },
        { status: 400 }
      )
    }

    // Check available balance
    const { data: balanceData } = await supabase.rpc('get_referral_balance', {
      p_user_id: user.id,
    })

    const balance = balanceData?.[0]
    if (!balance || balance.available_cents < amount_cents) {
      return NextResponse.json({ error: 'Insufficient available balance' }, { status: 400 })
    }

    // Create payout request
    const { data: payoutRequest, error: payoutError } = await supabase
      .from('payout_requests')
      .insert({
        user_id: user.id,
        amount_cents,
        currency: 'usd',
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (payoutError) {
      console.error('Error creating payout request:', payoutError)
      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 })
    }

    // Create Stripe transfer to connected account
    try {
      const stripe = getStripe()
      const transfer = await stripe.transfers.create({
        amount: amount_cents,
        currency: 'usd',
        destination: userData.stripe_connect_account_id,
        description: `Referral earnings payout - Request ${payoutRequest.id}`,
        metadata: {
          payout_request_id: payoutRequest.id,
          user_id: user.id,
        },
      })

      // Update payout request with Stripe transfer ID
      await supabase
        .from('payout_requests')
        .update({
          status: 'completed',
          stripe_payout_id: transfer.id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', payoutRequest.id)

      // Mark earnings as paid
      const { data: availableEarnings } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'available')
        .order('created_at', { ascending: true })

      let remainingAmount = amount_cents
      for (const earning of availableEarnings || []) {
        if (remainingAmount <= 0) break

        const amountToPay = Math.min(earning.amount_cents, remainingAmount)

        await supabase
          .from('referral_earnings')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_transfer_id: transfer.id,
          })
          .eq('id', earning.id)

        remainingAmount -= amountToPay
      }

      return NextResponse.json({
        success: true,
        payout: {
          ...payoutRequest,
          status: 'completed',
          stripe_payout_id: transfer.id,
        },
        transfer,
      })
    } catch (stripeError: any) {
      console.error('Stripe transfer error:', stripeError)

      // Update payout request as failed
      await supabase
        .from('payout_requests')
        .update({
          status: 'failed',
          failure_reason: stripeError.message,
        })
        .eq('id', payoutRequest.id)

      return NextResponse.json({ error: `Payout failed: ${stripeError.message}` }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in payout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/referrals/payout
 * Get payout history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: payouts, error: payoutsError } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })

    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError)
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      payouts: payouts || [],
      minimum_payout_cents: MINIMUM_PAYOUT_CENTS,
    })
  } catch (error) {
    console.error('Error in get payouts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
