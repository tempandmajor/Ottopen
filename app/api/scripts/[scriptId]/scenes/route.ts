import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, SceneService } from '@/src/lib/script-service'
import logger from '@/src/lib/logger'

// GET /api/scripts/[scriptId]/scenes - Get all scenes for a script
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

    const scenes = await SceneService.getByScriptId(params.scriptId)

    return NextResponse.json({ scenes })
  } catch (error: any) {
    logger.error('Failed to get scenes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/scripts/[scriptId]/scenes/generate - Auto-generate scenes from elements
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

    const scenes = await SceneService.generateFromElements(params.scriptId)

    return NextResponse.json({ scenes }, { status: 201 })
  } catch (error: any) {
    logger.error('Failed to generate scenes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
