import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

/**
 * GET /api/manuscripts/[manuscriptId]/chapters
 * Get all chapters for a manuscript
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { manuscriptId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('*, scenes(*)')
      .eq('manuscript_id', params.manuscriptId)
      .order('order_index', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort scenes within each chapter
    const chaptersWithSortedScenes = chapters?.map((chapter: any) => ({
      ...chapter,
      scenes: chapter.scenes?.sort((a: any, b: any) => a.order_index - b.order_index) || [],
    }))

    return NextResponse.json({ chapters: chaptersWithSortedScenes })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/manuscripts/[manuscriptId]/chapters
 * Create a new chapter
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { manuscriptId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    // Get the next order_index
    const { data: existingChapters } = await supabase
      .from('chapters')
      .select('order_index')
      .eq('manuscript_id', params.manuscriptId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = existingChapters && existingChapters.length > 0
      ? existingChapters[0].order_index + 1
      : 0

    const { data: chapter, error } = await supabase
      .from('chapters')
      .insert({
        manuscript_id: params.manuscriptId,
        title: body.title || `Chapter ${nextOrderIndex + 1}`,
        order_index: body.order_index ?? nextOrderIndex,
        word_count: body.word_count || 0,
        content: body.content || '',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ chapter }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
