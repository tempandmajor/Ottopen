import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, CharacterService } from '@/src/lib/script-service'
import { AIScriptService } from '@/src/lib/ai-script-service'

// POST /api/scripts/[scriptId]/ai/dialogue - Enhance dialogue with AI
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
    const { dialogue, characterId, emotion, instruction, previousLines } = body

    if (!dialogue) {
      return NextResponse.json({ error: 'Dialogue is required' }, { status: 400 })
    }

    // Get character if provided
    let character
    if (characterId) {
      const characters = await CharacterService.getByScriptId(params.scriptId)
      character = characters.find(c => c.id === characterId)
    }

    const result = await AIScriptService.enhanceDialogue(dialogue, character, {
      emotion,
      instruction,
      previousLines,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Failed to enhance dialogue:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
