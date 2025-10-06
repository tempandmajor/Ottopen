import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ResearchService } from '@/src/lib/research-service'
import { logError } from '@/src/lib/errors'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

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

    // SEC-FIX: Verify user owns the research note
    const { data: note } = await ResearchService.getById(params.noteId)
    if (!note) {
      return NextResponse.json({ error: 'Research note not found' }, { status: 404 })
    }
    if (note.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this research note' },
        { status: 403 }
      )
    }

    // SEC-FIX: Verify user has access to the script
    const supabase = createServerSupabaseClient()
    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .select('user_id, collaborators')
      .eq('id', script_id)
      .single()

    if (scriptError || !script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    // Check if user is owner or collaborator
    const isOwner = script.user_id === user.id
    const isCollaborator = script.collaborators?.some((c: any) => c.user_id === user.id)

    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this script' },
        { status: 403 }
      )
    }

    await ResearchService.linkToScript(params.noteId, script_id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logError(error, { context: 'POST /api/research/[noteId]/link' })
    return NextResponse.json({ error: 'Failed to link research note to script' }, { status: 500 })
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

    // SEC-FIX: Verify user owns the research note
    const { data: note } = await ResearchService.getById(params.noteId)
    if (!note) {
      return NextResponse.json({ error: 'Research note not found' }, { status: 404 })
    }
    if (note.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this research note' },
        { status: 403 }
      )
    }

    // SEC-FIX: Verify user has access to the script
    const supabase = createServerSupabaseClient()
    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .select('user_id, collaborators')
      .eq('id', scriptId)
      .single()

    if (scriptError || !script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    // Check if user is owner or collaborator
    const isOwner = script.user_id === user.id
    const isCollaborator = script.collaborators?.some((c: any) => c.user_id === user.id)

    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this script' },
        { status: 403 }
      )
    }

    await ResearchService.unlinkFromScript(params.noteId, scriptId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logError(error, { context: 'DELETE /api/research/[noteId]/link' })
    return NextResponse.json(
      { error: 'Failed to unlink research note from script' },
      { status: 500 }
    )
  }
}
