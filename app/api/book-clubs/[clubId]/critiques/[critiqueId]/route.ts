import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

async function handleGetCritique(
  request: NextRequest,
  { params }: { params: { clubId: string; critiqueId: string } }
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

    // Get critique with reviews
    const { data: critique, error } = await supabase
      .from('critiques')
      .select(
        `
        *,
        author:author_id(id, name, avatar_url),
        reviews:critique_reviews(
          id,
          reviewer:reviewer_id(id, name, avatar_url),
          ratings,
          overall_feedback,
          inline_comments,
          helpful_count,
          created_at
        )
      `
      )
      .eq('id', params.critiqueId)
      .eq('club_id', params.clubId)
      .single()

    if (error) throw error
    if (!critique) {
      return NextResponse.json({ error: 'Critique not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      critique,
    })
  } catch (error: any) {
    logger.error('Get critique error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch critique', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = createRateLimitedHandler('api', handleGetCritique)
