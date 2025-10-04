import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

/**
 * POST /api/referrals/confirm
 * Confirm a referral when the referred user becomes a paying subscriber
 * This should be called from Stripe webhook handler
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { user_id, subscription_tier } = body

    if (!user_id || !subscription_tier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find pending referral for this user
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', user_id)
      .eq('status', 'pending')
      .single()

    if (referralError || !referral) {
      return NextResponse.json({ error: 'No pending referral found' }, { status: 404 })
    }

    // Update referral status to confirmed
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        status: 'confirmed',
        referred_tier: subscription_tier,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', referral.id)

    if (updateError) {
      console.error('Error confirming referral:', updateError)
      return NextResponse.json({ error: 'Failed to confirm referral' }, { status: 500 })
    }

    // The trigger 'mark_earnings_available' will automatically update earnings to 'available'

    // Check for milestones
    const { data: referralCount } = await supabase
      .from('referrals')
      .select('id', { count: 'exact' })
      .eq('referrer_id', referral.referrer_id)
      .eq('status', 'confirmed')

    const count = referralCount?.length || 0
    const milestones = [
      { count: 5, type: 'ambassador', description: 'Referred 5 paying users' },
      { count: 10, type: 'champion', description: 'Referred 10 paying users' },
      { count: 25, type: 'legend', description: 'Referred 25 paying users' },
      { count: 50, type: 'legend', description: 'Referred 50 paying users' },
    ]

    for (const milestone of milestones) {
      if (count === milestone.count) {
        // Create milestone achievement
        await supabase.from('referral_milestones').insert({
          user_id: referral.referrer_id,
          milestone_type: milestone.type as 'ambassador' | 'champion' | 'legend',
          referral_count: milestone.count,
          reward_description: milestone.description,
          achieved_at: new Date().toISOString(),
          is_claimed: false,
        })
      }
    }

    return NextResponse.json({
      success: true,
      referral_confirmed: true,
    })
  } catch (error) {
    console.error('Error in confirm referral:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
