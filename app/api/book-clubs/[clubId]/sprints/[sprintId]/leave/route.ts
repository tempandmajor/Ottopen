import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

async function handleLeaveSprint(
  request: NextRequest,
  { params }: { params: { clubId: string; sprintId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from('sprint_participants')
      .delete()
      .eq('sprint_id', params.sprintId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    logger.error('Leave sprint error:', error)
    return NextResponse.json(
      { error: 'Failed to leave sprint', details: error.message },
      { status: 500 }
    )
  }
}

export const DELETE = createRateLimitedHandler('api', handleLeaveSprint)
