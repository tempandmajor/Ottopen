import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { DiscussionService } from '@/src/lib/book-club-service'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

// GET - Get replies for a discussion
async function handleGetReplies(
  request: NextRequest,
  { params }: { params: { discussionId: string } }
) {
  try {
    const { user, supabase } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const discussions = DiscussionService.fromClient(supabase)

    const replies = await discussions.getReplies(params.discussionId)

    return NextResponse.json({
      success: true,
      replies,
    })
  } catch (error: any) {
    logger.error('Get replies error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch replies', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = createRateLimitedHandler('api', handleGetReplies)

// POST - Add reply to discussion
async function handleAddReply(
  request: NextRequest,
  { params }: { params: { discussionId: string } }
) {
  try {
    const { user, supabase } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const discussions = DiscussionService.fromClient(supabase)

    const body = await request.json()
    const { content, parentReplyId } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const reply = await discussions.addReply(params.discussionId, user.id, content, parentReplyId)

    return NextResponse.json({
      success: true,
      reply,
    })
  } catch (error: any) {
    logger.error('Add reply error:', error)
    return NextResponse.json(
      { error: 'Failed to add reply', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = createRateLimitedHandler('api', handleAddReply)
