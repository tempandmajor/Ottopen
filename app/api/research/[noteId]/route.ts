import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ResearchService } from '@/src/lib/research-service'

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
    console.error('Update research note error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    console.error('Delete research note error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
