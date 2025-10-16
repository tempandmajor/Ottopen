import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService } from '@/src/lib/script-service'
import { AIScriptService } from '@/src/lib/ai-script-service'
import logger from '@/src/lib/logger'

// POST /api/scripts/[scriptId]/ai/beats - Generate story beats with AI
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
    const { logline, genre } = body

    const finalLogline = logline || script.logline
    const finalGenre = genre || (script.genre && script.genre[0]) || 'Drama'

    if (!finalLogline) {
      return NextResponse.json(
        { error: 'Logline is required (provide in request or script)' },
        { status: 400 }
      )
    }

    const result = await AIScriptService.generateBeats(finalLogline, finalGenre, script.script_type)

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error('Failed to generate beats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
