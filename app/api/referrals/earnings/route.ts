import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

/**
 * GET /api/referrals/earnings
 * Get earnings and balance for the authenticated user
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

    // Get balance using the database function
    const { data: balanceData, error: balanceError } = await supabase.rpc('get_referral_balance', {
      p_user_id: user.id,
    })

    if (balanceError) {
      console.error('Error fetching balance:', balanceError)
      return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 })
    }

    const balance = balanceData?.[0] || {
      total_earned_cents: 0,
      available_cents: 0,
      pending_cents: 0,
      paid_cents: 0,
    }

    // Get detailed earnings history
    const { data: earnings, error: earningsError } = await supabase
      .from('referral_earnings')
      .select(
        `
        *,
        referral:referrals(
          referred:users!referrals_referred_id_fkey(display_name, email)
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (earningsError) {
      console.error('Error fetching earnings:', earningsError)
      return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 })
    }

    // Get payout history
    const { data: payouts, error: payoutsError } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })

    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError)
    }

    return NextResponse.json({
      success: true,
      balance,
      earnings: earnings || [],
      payouts: payouts || [],
    })
  } catch (error) {
    console.error('Error in get earnings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
