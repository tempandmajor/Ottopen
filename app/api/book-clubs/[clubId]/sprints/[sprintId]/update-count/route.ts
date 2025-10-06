import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function handleUpdateWordCount(
  request: NextRequest,
  { params }: { params: { clubId: string; sprintId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const body = await request.json()
    const { current_word_count } = body

    if (typeof current_word_count !== 'number') {
      return NextResponse.json({ error: 'Invalid word count' }, { status: 400 })
    }

    // Update word count
    const { data: participant, error } = await supabase
      .from('sprint_participants')
      .update({ current_word_count })
      .eq('sprint_id', params.sprintId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      participant,
    })
  } catch (error: any) {
    console.error('Update word count error:', error)
    return NextResponse.json(
      { error: 'Failed to update word count', details: error.message },
      { status: 500 }
    )
  }
}

export const PUT = createRateLimitedHandler('api', handleUpdateWordCount)
