import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import Stripe from 'stripe'

// Force dynamic route
export const dynamic = 'force-dynamic'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  })
}

/**
 * GET /api/stripe/connect/status
 * Check Stripe Connect account status and update user record
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

    // Get user's Stripe Connect account ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!userData.stripe_connect_account_id) {
      return NextResponse.json({
        success: true,
        connected: false,
        onboarded: false,
        charges_enabled: false,
        payouts_enabled: false,
      })
    }

    // Retrieve account from Stripe
    const stripe = getStripe()
    const account = await stripe.accounts.retrieve(userData.stripe_connect_account_id)

    const onboarded = account.details_submitted || false
    const chargesEnabled = account.charges_enabled || false
    const payoutsEnabled = account.payouts_enabled || false

    // Update user record with latest status
    await supabase
      .from('users')
      .update({
        stripe_connect_onboarded: onboarded,
        stripe_connect_charges_enabled: chargesEnabled,
        stripe_connect_payouts_enabled: payoutsEnabled,
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      connected: true,
      onboarded,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      account_id: userData.stripe_connect_account_id,
    })
  } catch (error: any) {
    console.error('Error checking Connect status:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
