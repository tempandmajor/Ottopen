import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

async function handleGetParticipants(
  request: NextRequest,
  { params }: { params: { clubId: string; sprintId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: participants, error } = await supabase
      .from('sprint_leaderboard')
      .select('*')
      .eq('sprint_id', params.sprintId)
      .order('words_written', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      participants,
    })
  } catch (error: any) {
    logger.error('Get participants error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch participants', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = createRateLimitedHandler('api', handleGetParticipants)
