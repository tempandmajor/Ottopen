import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, CollaborationService } from '@/src/lib/script-service'

// DELETE /api/scripts/[scriptId]/collaborators/[collaboratorId] - Remove collaborator
export async function DELETE(
  request: NextRequest,
  { params }: { params: { scriptId: string; collaboratorId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const script = await ScriptService.getById(params.scriptId)
    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    if (script.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await CollaborationService.removeCollaborator(params.collaboratorId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to remove collaborator:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
