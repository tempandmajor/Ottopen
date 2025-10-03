import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, CharacterService, ElementService } from '@/src/lib/script-service'
import { AIScriptService } from '@/src/lib/ai-script-service'

// POST /api/scripts/[scriptId]/ai/character-voice - Check character voice consistency
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
    const { characterId } = body

    if (!characterId) {
      return NextResponse.json({ error: 'characterId is required' }, { status: 400 })
    }

    // Get character
    const characters = await CharacterService.getByScriptId(params.scriptId)
    const character = characters.find(c => c.id === characterId)

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Get all dialogue for this character
    const elements = await ElementService.getByScriptId(params.scriptId)
    const dialogueLines: Array<{ page: number; line: string }> = []

    elements.forEach((el, index) => {
      if (
        el.element_type === 'character' &&
        el.content.trim().toUpperCase() === character.name.toUpperCase()
      ) {
        // Get next element (should be dialogue)
        const nextEl = elements[index + 1]
        if (nextEl && nextEl.element_type === 'dialogue') {
          dialogueLines.push({
            page: Math.floor(el.page_number || 0),
            line: nextEl.content,
          })
        }
      }
    })

    if (dialogueLines.length === 0) {
      return NextResponse.json({ error: 'No dialogue found for this character' }, { status: 400 })
    }

    const analysis = await AIScriptService.checkCharacterVoice(
      character.name,
      dialogueLines,
      character.description
    )

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('Failed to check character voice:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
