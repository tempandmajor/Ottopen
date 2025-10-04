import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { validateRequest, payoutRequestSchema } from '@/src/lib/validation'
import { logError, formatErrorResponse } from '@/src/lib/errors'
import Stripe from 'stripe'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

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
 * SEC-001: Rate limiting applied
 * SEC-007: Transaction integrity with stored procedure
 * PERF-001: Fixed N+1 query with batch update
 */
async function handlePayoutRequest(request: NextRequest) {
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

    // Validate request body
    const validation = await validateRequest(request, payoutRequestSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { amount_cents } = validation.data

    if (amount_cents < MINIMUM_PAYOUT_CENTS) {
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
      .maybeSingle()

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
      logError(payoutError, { context: 'create_payout_request' })
      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 })
    }

    // SEC-007: Use idempotency key for Stripe transfer
    const idempotencyKey = `payout-${payoutRequest.id}-${Date.now()}`
    let transfer: Stripe.Transfer | null = null

    try {
      const stripe = getStripe()

      // Create Stripe transfer with idempotency
      transfer = await stripe.transfers.create(
        {
          amount: amount_cents,
          currency: 'usd',
          destination: userData.stripe_connect_account_id,
          description: `Referral earnings payout - Request ${payoutRequest.id}`,
          metadata: {
            payout_request_id: payoutRequest.id,
            user_id: user.id,
          },
        },
        {
          idempotencyKey,
        }
      )

      // SEC-007: Use stored procedure for atomic database transaction
      // PERF-001: Batch update instead of N+1 queries
      const { data: result, error: txError } = await supabase.rpc('complete_payout_transaction', {
        p_payout_id: payoutRequest.id,
        p_transfer_id: transfer.id,
        p_amount_cents: amount_cents,
        p_user_id: user.id,
      })

      if (txError) {
        throw new Error(`Transaction failed: ${txError.message}`)
      }

      return NextResponse.json({
        success: true,
        payout: {
          ...payoutRequest,
          status: 'completed',
          stripe_payout_id: transfer.id,
          completed_at: new Date().toISOString(),
        },
        earnings_updated: result?.[0]?.earnings_updated || 0,
      })
    } catch (stripeError: any) {
      // SEC-007: Handle transaction failure gracefully
      logError(stripeError, {
        context: 'payout_transaction',
        payoutId: payoutRequest.id,
        transferId: transfer?.id,
        userId: user.id,
      })

      // If Stripe transfer succeeded but DB failed, mark for manual reconciliation
      if (transfer) {
        await supabase
          .from('payout_requests')
          .update({
            status: 'pending_reconciliation',
            failure_reason: stripeError.message,
            stripe_payout_id: transfer.id,
          })
          .eq('id', payoutRequest.id)

        return NextResponse.json(
          {
            error: 'Payout initiated but requires reconciliation',
            requiresManualReview: true,
            transferId: transfer.id,
          },
          { status: 500 }
        )
      }

      // Stripe transfer failed - mark payout as failed
      await supabase
        .from('payout_requests')
        .update({
          status: 'failed',
          failure_reason: stripeError.message,
        })
        .eq('id', payoutRequest.id)

      return NextResponse.json(
        {
          error: 'Payout failed',
          message: stripeError.message,
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    logError(error, { context: 'payout_request' })
    return NextResponse.json(formatErrorResponse(error), { status: 500 })
  }
}

// SEC-001: Apply strict rate limiting for financial operations
export const POST = createRateLimitedHandler('payout', handlePayoutRequest)
