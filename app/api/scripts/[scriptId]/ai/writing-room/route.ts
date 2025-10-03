import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, ElementService } from '@/src/lib/script-service'
import { AIAdvancedService } from '@/src/lib/ai-advanced-service'

// POST /api/scripts/[scriptId]/ai/writing-room - Get feedback from different perspectives
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
    const { perspective } = body // 'producer' | 'director' | 'actor' | 'editor' | 'cinematographer'

    if (!perspective) {
      return NextResponse.json({ error: 'perspective is required' }, { status: 400 })
    }

    const elements = await ElementService.getByScriptId(params.scriptId)

    const feedback = await AIAdvancedService.generateWritingRoomFeedback(
      script,
      elements,
      perspective
    )

    return NextResponse.json({ perspective, feedback })
  } catch (error: any) {
    console.error('Failed to generate writing room feedback:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
