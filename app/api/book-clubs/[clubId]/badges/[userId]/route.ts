import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function handleGetBadges(
  request: NextRequest,
  { params }: { params: { clubId: string; userId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Get earned badges
    const { data: badges, error: badgesError } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', params.userId)
      .or(`club_id.eq.${params.clubId},club_id.is.null`)
      .order('earned_at', { ascending: false })

    if (badgesError) throw badgesError

    // Calculate progress towards next badges
    const { count: critiqueCount } = await supabase
      .from('critique_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('reviewer_id', params.userId)

    const { count: discussionCount } = await supabase
      .from('club_discussions')
      .select('id', { count: 'exact', head: true })
      .eq('club_id', params.clubId)
      .eq('author_id', params.userId)

    const earnedBadgeTypes = new Set(badges?.map(b => b.badge_type) || [])
    const progress = []

    if (!earnedBadgeTypes.has('first_critique') && (critiqueCount || 0) < 1) {
      progress.push({
        badge_name: 'First Critique',
        badge_description: 'Give your first critique',
        current: critiqueCount || 0,
        required: 1,
        icon: 'star',
      })
    }

    if (!earnedBadgeTypes.has('bookworm') && (critiqueCount || 0) < 10) {
      progress.push({
        badge_name: 'Bookworm',
        badge_description: 'Give 10 critiques',
        current: critiqueCount || 0,
        required: 10,
        icon: 'award',
      })
    }

    if (!earnedBadgeTypes.has('discussion_leader') && (discussionCount || 0) < 10) {
      progress.push({
        badge_name: 'Discussion Leader',
        badge_description: 'Start 10 discussions',
        current: discussionCount || 0,
        required: 10,
        icon: 'message',
      })
    }

    return NextResponse.json({
      success: true,
      badges,
      progress,
    })
  } catch (error: any) {
    console.error('Get badges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch badges', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = createRateLimitedHandler('api', handleGetBadges)
