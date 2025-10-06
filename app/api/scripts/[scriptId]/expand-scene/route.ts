import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { sceneExpander, SceneExpansionRequest } from '@/src/lib/ai/scene-expansion'

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
    const { sceneOutline, characterNames, sceneContext, targetLength, tone } = body

    // Fetch script for context
    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .select('genre')
      .eq('id', params.scriptId)
      .eq('user_id', user.id)
      .single()

    if (scriptError || !script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    const expansionRequest: SceneExpansionRequest = {
      sceneOutline,
      characterNames: characterNames || [],
      sceneContext: sceneContext || '',
      targetLength: targetLength || 'standard',
      tone: tone || 'dramatic',
      genre: script.genre || 'Drama',
    }

    const expandedScene = await sceneExpander.expandScene(expansionRequest)

    return NextResponse.json({
      success: true,
      scene: expandedScene,
    })
  } catch (error: any) {
    console.error('Scene expansion error:', error)
    return NextResponse.json(
      { error: 'Scene expansion failed', details: error.message },
      { status: 500 }
    )
  }
}
