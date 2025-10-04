import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { BookClubService } from '@/src/lib/book-club-service'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET /api/book-clubs - List clubs with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const club_type = searchParams.get('club_type') as any
    const genre = searchParams.get('genre') || undefined
    const search = searchParams.get('search') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const clubs = await BookClubService.list({
      club_type,
      genre,
      search,
      limit,
    })

    return NextResponse.json({ clubs })
  } catch (error: any) {
    console.error('Failed to list clubs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/book-clubs - Create new club
export async function POST(request: NextRequest) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const club = await BookClubService.create(user.id, body)

    return NextResponse.json({ club }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create club:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
