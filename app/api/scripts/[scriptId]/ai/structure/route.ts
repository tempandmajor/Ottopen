import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, ElementService } from '@/src/lib/script-service'
import { AIScriptService } from '@/src/lib/ai-script-service'

// GET /api/scripts/[scriptId]/ai/structure - Analyze script structure
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

    const elements = await ElementService.getByScriptId(params.scriptId)

    const analysis = await AIScriptService.analyzeStructure(
      elements,
      script.page_count,
      script.script_type
    )

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('Failed to analyze structure:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
