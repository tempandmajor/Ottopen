import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ResearchService } from '@/src/lib/research-service'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// POST /api/research/[noteId]/link - Link note to a script
export async function POST(request: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { script_id } = body

    if (!script_id) {
      return NextResponse.json({ error: 'script_id is required' }, { status: 400 })
    }

    await ResearchService.linkToScript(params.noteId, script_id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Link research note error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/research/[noteId]/link - Unlink note from a script
export async function DELETE(request: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const scriptId = searchParams.get('script_id')

    if (!scriptId) {
      return NextResponse.json({ error: 'script_id query param is required' }, { status: 400 })
    }

    await ResearchService.unlinkFromScript(params.noteId, scriptId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unlink research note error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
