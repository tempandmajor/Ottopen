import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, BeatService } from '@/src/lib/script-service'

// GET /api/scripts/[scriptId]/beats - Get beat board for script
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

    const beats = await BeatService.getByScriptId(params.scriptId)

    return NextResponse.json({ beats })
  } catch (error: any) {
    console.error('Failed to get beats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/scripts/[scriptId]/beats - Create beat
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

    if (script.is_locked) {
      return NextResponse.json({ error: 'Script is locked' }, { status: 400 })
    }

    const body = await request.json()
    const beat = await BeatService.create(params.scriptId, body)

    return NextResponse.json({ beat }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create beat:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
