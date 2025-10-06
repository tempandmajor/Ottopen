import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, CollaborationService } from '@/src/lib/script-service'
import { logError } from '@/src/lib/errors'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const addCollaboratorSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['editor', 'viewer', 'commenter']),
})

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
    logError(error, { context: 'GET /api/scripts/[scriptId]/collaborators' })
    return NextResponse.json({ error: 'Failed to get collaborators' }, { status: 500 })
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

    // SEC-FIX: Validate input with Zod
    const validationResult = addCollaboratorSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { userId, role } = validationResult.data

    const collaborator = await CollaborationService.addCollaborator(
      params.scriptId,
      userId,
      user.id,
      role
    )

    return NextResponse.json({ collaborator }, { status: 201 })
  } catch (error: any) {
    logError(error, { context: 'POST /api/scripts/[scriptId]/collaborators' })
    return NextResponse.json({ error: 'Failed to add collaborator' }, { status: 500 })
  }
}
