import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { BookClubService } from '@/src/lib/book-club-service'
import logger from '@/src/lib/logger'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET /api/book-clubs - List clubs with optional filters
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getServerUser()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const bookClubs = BookClubService.fromClient(supabase)

    const { searchParams } = new URL(request.url)
    const club_type = searchParams.get('club_type') as any
    const genre = searchParams.get('genre') || undefined
    const search = searchParams.get('search') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const clubs = await bookClubs.list({
      club_type,
      genre,
      search,
      limit,
    })

    return NextResponse.json({ clubs })
  } catch (error: any) {
    logger.error('Failed to list clubs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/book-clubs - Create new club
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const body = await request.json()

    const bookClubs = BookClubService.fromClient(supabase)
    const club = await bookClubs.create(user.id, body)

    return NextResponse.json({ club }, { status: 201 })
  } catch (error: any) {
    logger.error('Failed to create club:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
