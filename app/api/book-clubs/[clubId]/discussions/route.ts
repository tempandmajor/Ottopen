import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { DiscussionService, BookClubService } from '@/src/lib/book-club-service'
import { logError } from '@/src/lib/errors'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const createDiscussionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  script_id: z.string().uuid().optional(),
})

// GET /api/book-clubs/[clubId]/discussions - List discussions
async function handleGetDiscussions(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check membership
    const membership = await BookClubService.getMembership(params.clubId, user.id)
    if (!membership || membership.status !== 'active') {
      return NextResponse.json(
        { error: 'Must be an active member to view discussions' },
        { status: 403 }
      )
    }

    const discussions = await DiscussionService.getByClubId(params.clubId)

    return NextResponse.json({ discussions })
  } catch (error: any) {
    logError(error, { context: 'GET /api/book-clubs/[clubId]/discussions' })
    return NextResponse.json({ error: 'Failed to list discussions' }, { status: 500 })
  }
}

export const GET = createRateLimitedHandler('api', handleGetDiscussions)

// POST /api/book-clubs/[clubId]/discussions - Create discussion
async function handleCreateDiscussion(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check membership
    const membership = await BookClubService.getMembership(params.clubId, user.id)
    if (!membership || membership.status !== 'active') {
      return NextResponse.json(
        { error: 'Must be an active member to create discussions' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // SEC-FIX: Validate input
    const validationResult = createDiscussionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const discussion = await DiscussionService.create(params.clubId, user.id, validationResult.data)

    return NextResponse.json({ discussion }, { status: 201 })
  } catch (error: any) {
    logError(error, { context: 'POST /api/book-clubs/[clubId]/discussions' })
    return NextResponse.json({ error: 'Failed to create discussion' }, { status: 500 })
  }
}

export const POST = createRateLimitedHandler('api', handleCreateDiscussion)
