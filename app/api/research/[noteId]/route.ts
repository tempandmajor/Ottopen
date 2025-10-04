import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ResearchService } from '@/src/lib/research-service'
import { logError } from '@/src/lib/errors'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// PUT /api/research/[noteId] - Update a research note
export async function PUT(request: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const note = await ResearchService.update(params.noteId, body)

    return NextResponse.json(note)
  } catch (error: any) {
    logError(error, { context: 'PUT /api/research/[noteId]' })
    return NextResponse.json({ error: 'Failed to update research note' }, { status: 500 })
  }
}

// DELETE /api/research/[noteId] - Delete a research note
export async function DELETE(request: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ResearchService.delete(params.noteId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logError(error, { context: 'DELETE /api/research/[noteId]' })
    return NextResponse.json({ error: 'Failed to delete research note' }, { status: 500 })
  }
}
