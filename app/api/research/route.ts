import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ResearchService } from '@/src/lib/research-service'
import { logError } from '@/src/lib/errors'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET /api/research - Get all research notes for user
export async function GET(request: NextRequest) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const scriptId = searchParams.get('script_id')
    const query = searchParams.get('q')
    const tags = searchParams.get('tags')?.split(',')
    const sourceType = searchParams.get('source_type') || undefined

    let notes

    if (scriptId) {
      notes = await ResearchService.getByScriptId(scriptId)
    } else if (query) {
      notes = await ResearchService.search(user.id, query, {
        tags,
        source_type: sourceType,
      })
    } else {
      notes = await ResearchService.getByUserId(user.id)
    }

    return NextResponse.json({ notes })
  } catch (error: any) {
    logError(error, { context: 'GET /api/research' })
    return NextResponse.json({ error: 'Failed to fetch research notes' }, { status: 500 })
  }
}

// POST /api/research - Create a new research note
export async function POST(request: NextRequest) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const note = await ResearchService.create(user.id, body)

    return NextResponse.json(note, { status: 201 })
  } catch (error: any) {
    logError(error, { context: 'POST /api/research' })
    return NextResponse.json({ error: 'Failed to create research note' }, { status: 500 })
  }
}
