import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

async function handleGetActivity(request: NextRequest, { params }: { params: { clubId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

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
      .from('club_activity')
      .select(
        `
        *,
        user:user_id(id, name, avatar_url)
      `
      )
      .eq('club_id', params.clubId)

    // Apply filters
    if (filter === 'discussions') {
      query = query.in('activity_type', ['discussion_created', 'discussion_reply'])
    } else if (filter === 'critiques') {
      query = query.in('activity_type', ['critique_submitted', 'critique_received'])
    } else if (filter === 'events') {
      query = query.eq('activity_type', 'event_created')
    }

    query = query.order('created_at', { ascending: false }).limit(50)

    const { data: activities, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      activities,
    })
  } catch (error: any) {
    logger.error('Get activity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = createRateLimitedHandler('api', handleGetActivity)
