export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, synopsis, type, genre } = body

    if (!title || !synopsis) {
      return NextResponse.json({ error: 'Title and synopsis are required' }, { status: 400 })
    }

    // For now, generate rule-based loglines
    // This can be replaced with actual AI/OpenAI integration later
    const suggestions = generateLoglineSuggestions(title, synopsis, type, genre)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Generate logline error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateLoglineSuggestions(
  title: string,
  synopsis: string,
  type?: string,
  genre?: string
): string[] {
  // Extract key elements from synopsis
  const words = synopsis.toLowerCase().split(/\s+/)
  const hasProtagonist = words.some(w =>
    ['character', 'protagonist', 'hero', 'woman', 'man', 'person'].includes(w)
  )
  const hasConflict = words.some(w =>
    ['must', 'fight', 'discover', 'escape', 'solve', 'find'].includes(w)
  )
  const hasStakes = words.some(w =>
    ['before', 'or', 'unless', 'save', 'stop', 'prevent'].includes(w)
  )

  const suggestions: string[] = []

  // Template 1: When X happens, Y must Z
  suggestions.push(`When [INCITING INCIDENT], [PROTAGONIST] must [GOAL] to [OUTCOME].`)

  // Template 2: In a world where X, Y must Z
  if (genre?.toLowerCase().includes('sci') || genre?.toLowerCase().includes('fantasy')) {
    suggestions.push(
      `In a world where [SETTING], [PROTAGONIST] must [ACTION] before [CONSEQUENCE].`
    )
  }

  // Template 3: A [CHARACTER] discovers X and must Y
  suggestions.push(`A [CHARACTER DESCRIPTION] discovers [REVELATION] and must [ACTION] to [GOAL].`)

  // Template 4: After X, Y embarks on Z
  suggestions.push(`After [EVENT], [PROTAGONIST] embarks on [JOURNEY] to [DESTINATION/GOAL].`)

  // Template 5: Type-specific template
  if (type === 'screenplay' || type === 'tv_pilot') {
    suggestions.push(
      `[PROTAGONIST] faces their greatest challenge when [TWIST], forcing them to [CHOICE].`
    )
  } else if (type === 'book') {
    suggestions.push(
      `${title} follows [CHARACTER] as they navigate [CONFLICT] in pursuit of [DESIRE].`
    )
  }

  return suggestions.slice(0, 5)
}
