import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

async function handleGetSprints(request: NextRequest, { params }: { params: { clubId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'upcoming'

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
      .from('writing_sprints')
      .select(
        `
        *,
        participant_count:sprint_participants(count)
      `
      )
      .eq('club_id', params.clubId)

    // Apply filter
    if (filter === 'upcoming') {
      query = query.eq('status', 'scheduled').gte('start_time', new Date().toISOString())
    } else if (filter === 'active') {
      query = query.eq('status', 'active')
    } else if (filter === 'completed') {
      query = query.eq('status', 'completed')
    }

    query = query.order('start_time', { ascending: filter !== 'completed' })

    const { data: sprints, error } = await query

    if (error) throw error

    // Format participant count
    const formattedSprints = sprints?.map(sprint => ({
      ...sprint,
      participant_count: sprint.participant_count?.[0]?.count || 0,
    }))

    return NextResponse.json({
      success: true,
      sprints: formattedSprints,
    })
  } catch (error: any) {
    logger.error('Get sprints error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sprints', details: error.message },
      { status: 500 }
    )
  }
}

async function handleCreateSprint(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const body = await request.json()
    const { title, description, duration_minutes, start_time, max_participants, word_count_goal } =
      body

    if (!title || !duration_minutes || !start_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create sprint
    const { data: sprint, error } = await supabase
      .from('writing_sprints')
      .insert({
        club_id: params.clubId,
        created_by_id: user.id,
        title,
        description,
        duration_minutes,
        start_time,
        max_participants,
        word_count_goal,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      sprint,
    })
  } catch (error: any) {
    logger.error('Create sprint error:', error)
    return NextResponse.json(
      { error: 'Failed to create sprint', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = createRateLimitedHandler('api', handleGetSprints)
export const POST = createRateLimitedHandler('api', handleCreateSprint)
