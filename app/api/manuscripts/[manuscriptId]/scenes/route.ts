import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

/**
 * GET /api/manuscripts/[manuscriptId]/scenes
 * Get all scenes for a manuscript (optionally filtered by chapter)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { manuscriptId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')

    let query = supabase
      .from('scenes')
      .select('*')
      .eq('manuscript_id', params.manuscriptId)
      .order('order_index', { ascending: true })

    // Filter by chapter if provided
    if (chapterId) {
      query = query.eq('chapter_id', chapterId)
    }

    const { data: scenes, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ scenes })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/manuscripts/[manuscriptId]/scenes
 * Create a new scene
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { manuscriptId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    // Get the next order_index for this chapter (or manuscript if no chapter)
    let query = supabase
      .from('scenes')
      .select('order_index')
      .eq('manuscript_id', params.manuscriptId)
      .order('order_index', { ascending: false })
      .limit(1)

    if (body.chapter_id) {
      query = query.eq('chapter_id', body.chapter_id)
    }

    const { data: existingScenes } = await query

    const nextOrderIndex = existingScenes && existingScenes.length > 0
      ? existingScenes[0].order_index + 1
      : 0

    const { data: scene, error } = await supabase
      .from('scenes')
      .insert({
        manuscript_id: params.manuscriptId,
        chapter_id: body.chapter_id || null,
        title: body.title || `Scene ${nextOrderIndex + 1}`,
        order_index: body.order_index ?? nextOrderIndex,
        word_count: body.word_count || 0,
        content: body.content || '',
        pov_character: body.pov_character || null,
        location: body.location || null,
        time_of_day: body.time_of_day || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ scene }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
