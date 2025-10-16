import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, ElementService } from '@/src/lib/script-service'
import { AIDocumentaryService } from '@/src/lib/ai-documentary-service'
import logger from '@/src/lib/logger'

// GET /api/scripts/[scriptId]/documentary/fact-check - Fact-check documentary claims
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

    if (script.script_type !== 'documentary') {
      return NextResponse.json(
        { error: 'This endpoint is only for documentary scripts' },
        { status: 400 }
      )
    }

    const elements = await ElementService.getByScriptId(params.scriptId)

    const factChecks = await AIDocumentaryService.factCheckScript(script, elements)

    return NextResponse.json({ factChecks })
  } catch (error: any) {
    logger.error('Failed to fact-check script:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
