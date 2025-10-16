import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, ElementService } from '@/src/lib/script-service'
import logger from '@/src/lib/logger'

// PATCH /api/scripts/[scriptId]/elements/[elementId] - Update element
export async function PATCH(
  request: NextRequest,
  { params }: { params: { scriptId: string; elementId: string } }
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

    if (script.is_locked) {
      return NextResponse.json({ error: 'Script is locked' }, { status: 400 })
    }

    const body = await request.json()
    const element = await ElementService.update(params.elementId, body)

    return NextResponse.json({ element })
  } catch (error: any) {
    logger.error('Failed to update element:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/scripts/[scriptId]/elements/[elementId] - Delete element
export async function DELETE(
  request: NextRequest,
  { params }: { params: { scriptId: string; elementId: string } }
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

    if (script.is_locked) {
      return NextResponse.json({ error: 'Script is locked' }, { status: 400 })
    }

    await ElementService.delete(params.elementId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Failed to delete element:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
