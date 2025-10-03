import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, ElementService, CharacterService } from '@/src/lib/script-service'
import { AIAdvancedService } from '@/src/lib/ai-advanced-service'

// GET /api/scripts/[scriptId]/ai/budget - Estimate production budget
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
    const characters = await CharacterService.getByScriptId(params.scriptId)

    const budgetEstimation = await AIAdvancedService.estimateBudget(script, elements, characters)

    return NextResponse.json(budgetEstimation)
  } catch (error: any) {
    console.error('Failed to estimate budget:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
