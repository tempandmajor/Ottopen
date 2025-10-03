import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService } from '@/src/lib/script-service'

// POST /api/scripts/[scriptId]/lock - Lock script to prevent edits
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

    const updatedScript = await ScriptService.lock(params.scriptId)

    return NextResponse.json({ script: updatedScript })
  } catch (error: any) {
    console.error('Failed to lock script:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/scripts/[scriptId]/lock - Unlock script
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

    const updatedScript = await ScriptService.unlock(params.scriptId)

    return NextResponse.json({ script: updatedScript })
  } catch (error: any) {
    console.error('Failed to unlock script:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
