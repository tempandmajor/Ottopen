import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { BookClubService } from '@/src/lib/book-club-service'
import logger from '@/src/lib/logger'

// GET /api/book-clubs/[clubId] - Get club details
export async function GET(request: NextRequest, { params }: { params: { clubId: string } }) {
  try {
    const { supabase } = await getServerUser()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const bookClubs = BookClubService.fromClient(supabase)
    const club = await bookClubs.getById(params.clubId)

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    return NextResponse.json({ club })
  } catch (error: any) {
    logger.error('Failed to get club:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/book-clubs/[clubId] - Update club
export async function PATCH(request: NextRequest, { params }: { params: { clubId: string } }) {
  try {
    const { user, supabase } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const bookClubs = BookClubService.fromClient(supabase)

    // Check if user is owner or moderator
    const membership = await bookClubs.getMembership(params.clubId, user.id)
    if (!membership || !['owner', 'moderator'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const club = await bookClubs.update(params.clubId, body)

    return NextResponse.json({ club })
  } catch (error: any) {
    logger.error('Failed to update club:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/book-clubs/[clubId] - Delete club
export async function DELETE(request: NextRequest, { params }: { params: { clubId: string } }) {
  try {
    const { user, supabase } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const bookClubs = BookClubService.fromClient(supabase)

    // Check if user is owner
    const membership = await bookClubs.getMembership(params.clubId, user.id)
    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await bookClubs.delete(params.clubId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Failed to delete club:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
