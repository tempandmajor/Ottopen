import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

async function handleJoinSprint(
  request: NextRequest,
  { params }: { params: { clubId: string; sprintId: string } }
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

    // Check sprint status
    const { data: sprint } = await supabase
      .from('writing_sprints')
      .select('*')
      .eq('id', params.sprintId)
      .single()

    if (!sprint || sprint.status === 'completed') {
      return NextResponse.json({ error: 'Sprint is not available' }, { status: 400 })
    }

    const body = await request.json()
    const { starting_word_count = 0 } = body

    // Join sprint
    const { data: participant, error } = await supabase
      .from('sprint_participants')
      .insert({
        sprint_id: params.sprintId,
        user_id: user.id,
        starting_word_count,
        current_word_count: starting_word_count,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already joined this sprint' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      participant,
    })
  } catch (error: any) {
    logger.error('Join sprint error:', error)
    return NextResponse.json(
      { error: 'Failed to join sprint', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = createRateLimitedHandler('api', handleJoinSprint)
