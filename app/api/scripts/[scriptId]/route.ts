import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService } from '@/src/lib/script-service'
import logger from '@/src/lib/logger'

// GET /api/scripts/[scriptId] - Get script by ID
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

    // Verify ownership or collaboration access
    if (script.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ script })
  } catch (error: any) {
    logger.error('Failed to get script:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/scripts/[scriptId] - Update script
export async function PATCH(request: NextRequest, { params }: { params: { scriptId: string } }) {
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
    const updatedScript = await ScriptService.update(params.scriptId, body)

    return NextResponse.json({ script: updatedScript })
  } catch (error: any) {
    logger.error('Failed to update script:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/scripts/[scriptId] - Delete script
export async function DELETE(request: NextRequest, { params }: { params: { scriptId: string } }) {
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

    await ScriptService.delete(params.scriptId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Failed to delete script:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
