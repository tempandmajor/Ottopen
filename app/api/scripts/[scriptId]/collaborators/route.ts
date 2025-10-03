import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, CollaborationService } from '@/src/lib/script-service'

// GET /api/scripts/[scriptId]/collaborators - Get all collaborators
export async function GET(request: NextRequest, { params }: { params: { scriptId: string } }) {
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

    const collaborators = await CollaborationService.getCollaborators(params.scriptId)

    return NextResponse.json({ collaborators })
  } catch (error: any) {
    console.error('Failed to get collaborators:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/scripts/[scriptId]/collaborators - Add collaborator
export async function POST(request: NextRequest, { params }: { params: { scriptId: string } }) {
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

    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const collaborator = await CollaborationService.addCollaborator(
      params.scriptId,
      userId,
      user.id,
      role
    )

    return NextResponse.json({ collaborator }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to add collaborator:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
