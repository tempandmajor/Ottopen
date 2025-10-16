import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

async function handleGetLeaderboard(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'weekly'

    const supabase = createServerSupabaseClient()

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    if (timeframe === 'weekly') {
      startDate.setDate(now.getDate() - 7)
    } else {
      startDate.setMonth(now.getMonth() - 1)
    }

    // Get all active members
    const { data: members } = await supabase
      .from('club_memberships')
      .select('user_id, profiles!club_memberships_user_id_fkey(name, avatar_url)')
      .eq('club_id', params.clubId)
      .eq('status', 'active')

    if (!members) {
      return NextResponse.json({ success: true, leaderboard: [] })
    }

    // Calculate points for each member
    const leaderboard = await Promise.all(
      members.map(async member => {
        const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
        let score = 0

        // Points from discussions (5 points each)
        const { count: discussionCount } = await supabase
          .from('club_discussions')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', params.clubId)
          .eq('author_id', member.user_id)
          .gte('created_at', startDate.toISOString())

        score += (discussionCount || 0) * 5

        // Points from replies (2 points each)
        const { count: replyCount } = await supabase
          .from('discussion_replies')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', member.user_id)
          .gte('created_at', startDate.toISOString())

        score += (replyCount || 0) * 2

        // Points from critiques (10 points each)
        const { count: critiqueCount } = await supabase
          .from('critique_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('reviewer_id', member.user_id)
          .gte('created_at', startDate.toISOString())

        score += (critiqueCount || 0) * 10

        // Points from helpful critiques (5 bonus points)
        const { count: helpfulCount } = await supabase
          .from('critique_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('reviewer_id', member.user_id)
          .gte('helpful_count', 1)
          .gte('created_at', startDate.toISOString())

        score += (helpfulCount || 0) * 5

        // Points from events (5 points each)
        const { count: eventCount } = await supabase
          .from('club_events')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', params.clubId)
          .eq('created_by_id', member.user_id)
          .gte('created_at', startDate.toISOString())

        score += (eventCount || 0) * 5

        return {
          user_id: member.user_id,
          name: profile?.name || 'Unknown',
          avatar_url: profile?.avatar_url,
          score,
        }
      })
    )

    // Sort by score and add rank
    const sortedLeaderboard = leaderboard
      .sort((a, b) => b.score - a.score)
      .filter(entry => entry.score > 0)
      .slice(0, 10)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))

    return NextResponse.json({
      success: true,
      leaderboard: sortedLeaderboard,
    })
  } catch (error: any) {
    logger.error('Get leaderboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = createRateLimitedHandler('api', handleGetLeaderboard)
