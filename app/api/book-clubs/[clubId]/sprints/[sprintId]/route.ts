import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function handleGetSprint(
  request: NextRequest,
  { params }: { params: { clubId: string; sprintId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: sprint, error } = await supabase
      .from('writing_sprints')
      .select('*')
      .eq('id', params.sprintId)
      .eq('club_id', params.clubId)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      sprint,
    })
  } catch (error: any) {
    console.error('Get sprint error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sprint', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = createRateLimitedHandler('api', handleGetSprint)
