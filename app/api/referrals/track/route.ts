import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

/**
 * POST /api/referrals/track
 * Track a referral when a new user signs up with a referral code
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { referral_code, referred_user_id } = body

    if (!referral_code || !referred_user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find the referral code
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', referral_code)
      .eq('is_active', true)
      .single()

    if (codeError || !codeData) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    }

    // Prevent self-referral
    if (codeData.user_id === referred_user_id) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })
    }

    // Check if referral already exists
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', referred_user_id)
      .single()

    if (existingReferral) {
      return NextResponse.json({ error: 'User already referred' }, { status: 400 })
    }

    // Create referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: codeData.user_id,
        referred_id: referred_user_id,
        referral_code: referral_code,
        status: 'pending',
        credit_amount: 200, // $2.00 in cents
        credit_type: 'dollars',
        referred_tier: 'free', // Will be updated when they subscribe
      })
      .select()
      .single()

    if (referralError) {
      console.error('Error creating referral:', referralError)
      return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 })
    }

    // Create pending earnings record
    const { error: earningsError } = await supabase.from('referral_earnings').insert({
      user_id: codeData.user_id,
      referral_id: referral.id,
      amount_cents: 200, // $2.00
      currency: 'usd',
      status: 'pending',
    })

    if (earningsError) {
      console.error('Error creating earnings:', earningsError)
    }

    // Increment uses count
    await supabase
      .from('referral_codes')
      .update({ uses_count: codeData.uses_count + 1 })
      .eq('id', codeData.id)

    return NextResponse.json({
      success: true,
      referral,
    })
  } catch (error) {
    console.error('Error in track referral:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
