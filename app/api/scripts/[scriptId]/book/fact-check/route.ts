import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, ElementService } from '@/src/lib/script-service'
import { AIBookService } from '@/src/lib/ai-book-service'
import logger from '@/src/lib/logger'

// GET /api/scripts/[scriptId]/book/fact-check - Fact-check book content
export async function GET(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const script = await ScriptService.getById(params.scriptId)
    if (!script || script.user_id !== user.id) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    const elements = await ElementService.getByScriptId(params.scriptId)
    const factChecks = await AIBookService.factCheckContent(elements)

    return NextResponse.json({ fact_checks: factChecks })
  } catch (error) {
    logger.error('Fact-check error:', error)
    return NextResponse.json({ error: 'Failed to fact-check content' }, { status: 500 })
  }
}
