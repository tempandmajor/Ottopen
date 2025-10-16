import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

// Force dynamic route
export const dynamic = 'force-dynamic'

/**
 * GET /api/referrals/stats
 * Get referral statistics for the authenticated user
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

    // Get referral code
    const { data: referralCode } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    // Get referral counts by status
    const { data: referrals } = await supabase
      .from('referrals')
      .select('status, referred_tier')
      .eq('referrer_id', user.id)

    const stats = {
      total: referrals?.length || 0,
      confirmed: referrals?.filter((r: any) => r.status === 'confirmed').length || 0,
      pending: referrals?.filter((r: any) => r.status === 'pending').length || 0,
      by_tier: {
        free: referrals?.filter((r: any) => r.referred_tier === 'free').length || 0,
        premium: referrals?.filter((r: any) => r.referred_tier === 'premium').length || 0,
        pro: referrals?.filter((r: any) => r.referred_tier === 'pro').length || 0,
        industry_basic:
          referrals?.filter((r: any) => r.referred_tier === 'industry_basic').length || 0,
        industry_premium:
          referrals?.filter((r: any) => r.referred_tier === 'industry_premium').length || 0,
      },
    }

    // Get milestones
    const { data: milestones } = await supabase
      .from('referral_milestones')
      .select('*')
      .eq('user_id', user.id)
      .order('achieved_at', { ascending: false })

    // Get recent referrals
    const { data: recentReferrals } = await supabase
      .from('referrals')
      .select(
        `
        *,
        referred:users!referrals_referred_id_fkey(display_name, email, account_tier)
      `
      )
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      referral_code: referralCode,
      stats,
      milestones: milestones || [],
      recent_referrals: recentReferrals || [],
    })
  } catch (error) {
    logger.error('Error in get stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
