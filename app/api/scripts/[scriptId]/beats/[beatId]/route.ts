import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, BeatService } from '@/src/lib/script-service'
import logger from '@/src/lib/logger'

// PATCH /api/scripts/[scriptId]/beats/[beatId] - Update beat
export async function PATCH(
  request: NextRequest,
  { params }: { params: { scriptId: string; beatId: string } }
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
    const beat = await BeatService.update(params.beatId, body)

    return NextResponse.json({ beat })
  } catch (error: any) {
    logger.error('Failed to update beat:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/scripts/[scriptId]/beats/[beatId] - Delete beat
export async function DELETE(
  request: NextRequest,
  { params }: { params: { scriptId: string; beatId: string } }
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

    await BeatService.delete(params.beatId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Failed to delete beat:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
