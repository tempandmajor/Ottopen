import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { BookClubService } from '@/src/lib/book-club-service'
import logger from '@/src/lib/logger'

// POST /api/book-clubs/[clubId]/join - Join a club
export async function POST(request: NextRequest, { params }: { params: { clubId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const club = await BookClubService.getById(params.clubId)
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    // Check if club is full
    if (club.max_members && club.member_count >= club.max_members) {
      return NextResponse.json({ error: 'Club is full' }, { status: 400 })
    }

    // Check if already a member
    const existing = await BookClubService.getMembership(params.clubId, user.id)
    if (existing) {
      return NextResponse.json({ error: 'Already a member' }, { status: 400 })
    }

    // Determine status based on club type
    const status = club.club_type === 'public' ? 'active' : 'pending'

    const membership = await BookClubService.addMember(params.clubId, user.id, 'member', status)

    return NextResponse.json({ membership }, { status: 201 })
  } catch (error: any) {
    logger.error('Failed to join club:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/book-clubs/[clubId]/join - Leave a club
export async function DELETE(request: NextRequest, { params }: { params: { clubId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await BookClubService.getMembership(params.clubId, user.id)
    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 400 })
    }

    // Cannot leave if you're the owner
    if (membership.role === 'owner') {
      return NextResponse.json(
        { error: 'Owner cannot leave. Transfer ownership first.' },
        { status: 400 }
      )
    }

    await BookClubService.removeMember(params.clubId, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Failed to leave club:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
