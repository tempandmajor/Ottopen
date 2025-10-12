import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { scriptAutocomplete, AutocompleteContext } from '@/src/lib/ai/script-autocomplete'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentLine, previousLines, elementType, characterName, useAI = false } = body

    // Verify script access
    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .select('id, genre')
      .eq('id', params.scriptId)
      .eq('user_id', user.id)
      .single()

    if (scriptError || !script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    const context: AutocompleteContext = {
      currentLine,
      previousLines: previousLines || [],
      elementType,
      characterName,
      genre: script.genre,
      sceneContext: extractSceneContext(previousLines),
    }

    // Get suggestions
    const suggestions = useAI
      ? await scriptAutocomplete.getSuggestions(context)
      : scriptAutocomplete.getQuickSuggestions(context)

    return NextResponse.json({
      suggestions,
      useAI,
    })
  } catch (error: any) {
    console.error('Autocomplete error:', error)
    return NextResponse.json(
      { error: 'Autocomplete failed', details: error.message },
      { status: 500 }
    )
  }
}

function extractSceneContext(previousLines: string[]): string {
  // Find the most recent scene heading
  for (let i = previousLines.length - 1; i >= 0; i--) {
    const line = previousLines[i].trim()
    if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(line)) {
      return line
    }
  }
  return 'Unknown scene'
}
