import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function handleGetMembers(request: NextRequest, { params }: { params: { clubId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') || 'recent'

    const supabase = createServerSupabaseClient()

    // Check membership
    const { data: membership } = await supabase
      .from('club_memberships')
      .select('id')
      .eq('club_id', params.clubId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a club member' }, { status: 403 })
    }

    let query = supabase
      .from('club_memberships')
      .select(
        `
        id,
        user_id,
        role,
        credits,
        joined_at,
        profiles!club_memberships_user_id_fkey(name, avatar_url)
      `
      )
      .eq('club_id', params.clubId)
      .eq('status', 'active')

    // Sort
    switch (sortBy) {
      case 'active':
        query = query.order('last_active_at', { ascending: false })
        break
      case 'credits':
        query = query.order('credits', { ascending: false })
        break
      case 'recent':
      default:
        query = query.order('joined_at', { ascending: false })
    }

    const { data: memberships, error } = await query

    if (error) throw error

    // Get stats for each member
    const memberStats = await Promise.all(
      memberships?.map(async m => {
        // Get discussion count
        const { count: discussionCount } = await supabase
          .from('club_discussions')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', params.clubId)
          .eq('author_id', m.user_id)

        // Get critiques given count
        const { count: critiquesGiven } = await supabase
          .from('critique_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('reviewer_id', m.user_id)

        // Get critiques received count
        const { count: critiquesReceived } = await supabase
          .from('critiques')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', params.clubId)
          .eq('author_id', m.user_id)

        // Check if current user is following this member
        const { data: followData } = await supabase
          .from('member_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', m.user_id)
          .single()

        const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
        return {
          id: m.id,
          user_id: m.user_id,
          name: profile?.name || 'Unknown',
          avatar_url: profile?.avatar_url,
          role: m.role,
          credits: m.credits,
          joined_at: m.joined_at,
          stats: {
            discussions: discussionCount || 0,
            critiques_given: critiquesGiven || 0,
            critiques_received: critiquesReceived || 0,
          },
          is_following: !!followData,
        }
      }) || []
    )

    return NextResponse.json({
      success: true,
      members: memberStats,
    })
  } catch (error: any) {
    console.error('Get members error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = createRateLimitedHandler('api', handleGetMembers)
