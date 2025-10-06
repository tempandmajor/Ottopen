import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function handleGetParticipation(
  request: NextRequest,
  { params }: { params: { clubId: string; sprintId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: participant, error } = await supabase
      .from('sprint_participants')
      .select('*')
      .eq('sprint_id', params.sprintId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({
      success: true,
      participant,
    })
  } catch (error: any) {
    console.error('Get participation error:', error)
    return NextResponse.json(
      { error: 'Failed to check participation', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = createRateLimitedHandler('api', handleGetParticipation)
