import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

/**
 * PATCH /api/manuscripts/[manuscriptId]/scenes/[sceneId]
 * Update a scene
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { manuscriptId: string; sceneId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    // Build update object with only provided fields
    const updates: any = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.content !== undefined) updates.content = body.content
    if (body.order_index !== undefined) updates.order_index = body.order_index
    if (body.word_count !== undefined) updates.word_count = body.word_count
    if (body.chapter_id !== undefined) updates.chapter_id = body.chapter_id
    if (body.pov_character !== undefined) updates.pov_character = body.pov_character
    if (body.location !== undefined) updates.location = body.location
    if (body.time_of_day !== undefined) updates.time_of_day = body.time_of_day

    const { data: scene, error } = await supabase
      .from('scenes')
      .update(updates)
      .eq('id', params.sceneId)
      .eq('manuscript_id', params.manuscriptId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
    }

    return NextResponse.json({ scene })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/manuscripts/[manuscriptId]/scenes/[sceneId]
 * Delete a scene
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { manuscriptId: string; sceneId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from('scenes')
      .delete()
      .eq('id', params.sceneId)
      .eq('manuscript_id', params.manuscriptId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
