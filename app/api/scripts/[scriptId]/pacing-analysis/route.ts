import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { sceneExpander } from '@/src/lib/ai/scene-expansion'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all scenes
    const { data: elements, error: elementsError } = await supabase
      .from('script_elements')
      .select('*')
      .eq('script_id', params.scriptId)
      .order('order_index', { ascending: true })

    if (elementsError) {
      return NextResponse.json({ error: 'Failed to fetch scenes' }, { status: 500 })
    }

    // Group into scenes (scene heading to next scene heading)
    const scenes: Array<{ pageCount: number; content: string }> = []
    let currentScene: string[] = []
    let currentPageCount = 0

    for (const elem of elements as any[]) {
      if (elem.element_type === 'Scene Heading') {
        if (currentScene.length > 0) {
          scenes.push({
            pageCount: currentPageCount || 0.5,
            content: currentScene.join('\n'),
          })
        }
        currentScene = [elem.content]
        currentPageCount = 0
      } else {
        currentScene.push(elem.content)
        // Estimate page count (rough: 55 lines = 1 page)
        currentPageCount += elem.content.split('\n').length / 55
      }
    }

    // Add last scene
    if (currentScene.length > 0) {
      scenes.push({
        pageCount: currentPageCount || 0.5,
        content: currentScene.join('\n'),
      })
    }

    const analysis = sceneExpander.analyzePacing(scenes)

    return NextResponse.json({
      success: true,
      analysis,
      totalScenes: scenes.length,
      totalPages: scenes.reduce((sum, s) => sum + s.pageCount, 0).toFixed(1),
    })
  } catch (error: any) {
    logger.error('Pacing analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed', details: error.message }, { status: 500 })
  }
}
