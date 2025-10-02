import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { DiscussionService, BookClubService } from '@/src/lib/book-club-service'

// GET /api/book-clubs/[clubId]/discussions - List discussions
export async function GET(request: NextRequest, { params }: { params: { clubId: string } }) {
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
    console.error('Failed to list discussions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/book-clubs/[clubId]/discussions - Create discussion
export async function POST(request: NextRequest, { params }: { params: { clubId: string } }) {
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
    const discussion = await DiscussionService.create(params.clubId, user.id, body)

    return NextResponse.json({ discussion }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create discussion:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
