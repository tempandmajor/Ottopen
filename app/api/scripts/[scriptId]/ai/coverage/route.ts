import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, ElementService } from '@/src/lib/script-service'
import { AIScriptService } from '@/src/lib/ai-script-service'
import logger from '@/src/lib/logger'

// GET /api/scripts/[scriptId]/ai/coverage - Generate AI script coverage
export async function GET(
  request: NextRequest,
  { params }: { params: { scriptId: string } }
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

    const elements = await ElementService.getByScriptId(params.scriptId)

    const coverage = await AIScriptService.generateCoverage(
      script.title,
      script.logline || 'No logline provided',
      script.genre || [],
      elements,
      script.page_count
    )

    return NextResponse.json(coverage)
  } catch (error: any) {
    logger.error('Failed to generate coverage:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
