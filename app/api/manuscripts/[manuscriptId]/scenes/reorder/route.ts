import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

/**
 * PATCH /api/manuscripts/[manuscriptId]/scenes/reorder
 * Body: { scene_id: string, to_chapter_id: string | null, to_index: number, from_chapter_id?: string | null }
 * Moves a scene within or across chapters and normalizes order_index.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { manuscriptId: string } }
) {
  try {
    // Cast to any to avoid strict schema coupling for this endpoint
    const supabase = createServerSupabaseClient() as any
    const body = await request.json()
    const sceneId: string = body.scene_id
    const toChapterId: string | null = body.to_chapter_id ?? null
    const toIndex: number = typeof body.to_index === 'number' ? body.to_index : 0

    if (!sceneId) {
      return NextResponse.json({ error: 'scene_id is required' }, { status: 400 })
    }

    // Fetch the scene to get current chapter
    const { data: currentScene, error: sceneErr } = await supabase
      .from('scenes')
      .select('id, chapter_id, manuscript_id')
      .eq('id', sceneId)
      .single()

    if (sceneErr || !currentScene) {
      return NextResponse.json({ error: sceneErr?.message || 'Scene not found' }, { status: 404 })
    }

    if (currentScene.manuscript_id !== params.manuscriptId) {
      return NextResponse.json({ error: 'Scene does not belong to manuscript' }, { status: 400 })
    }

    // Move scene: set chapter and a temporary fractional order_index
    // We'll normalize indices after inserting into the target chapter list.
    const tmpIndex = toIndex + 0.5

    const { error: moveErr } = await supabase
      .from('scenes')
      .update({ chapter_id: toChapterId, order_index: tmpIndex })
      .eq('id', sceneId)

    if (moveErr) {
      return NextResponse.json({ error: moveErr.message }, { status: 500 })
    }

    // Normalize target chapter order indices
    const normalizeChapter = async (chapterId: string | null) => {
      let query = supabase
        .from('scenes')
        .select('id, order_index')
        .eq('manuscript_id', params.manuscriptId)
        .order('order_index', { ascending: true })

      if (chapterId) query = query.eq('chapter_id', chapterId)
      else query = query.is('chapter_id', null)

      const { data: scenes, error } = await query
      if (error) return error

      if (!scenes) return null
      // Reassign order_index sequentially
      for (let i = 0; i < scenes.length; i++) {
        const s = scenes[i]
        const { error: updErr } = await supabase
          .from('scenes')
          .update({ order_index: i })
          .eq('id', s.id)
        if (updErr) return updErr
      }
      return null
    }

    const normTargetErr = await normalizeChapter(toChapterId)
    if (normTargetErr) {
      return NextResponse.json({ error: normTargetErr.message }, { status: 500 })
    }

    // Also normalize the old chapter if changed
    if (currentScene.chapter_id !== toChapterId) {
      const normSourceErr = await normalizeChapter(currentScene.chapter_id)
      if (normSourceErr) {
        return NextResponse.json({ error: normSourceErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
