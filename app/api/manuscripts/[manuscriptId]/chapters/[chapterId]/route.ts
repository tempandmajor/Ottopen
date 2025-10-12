import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

/**
 * PATCH /api/manuscripts/[manuscriptId]/chapters/[chapterId]
 * Update a chapter
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { manuscriptId: string; chapterId: string } }
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

    const { data: chapter, error } = await supabase
      .from('chapters')
      .update(updates)
      .eq('id', params.chapterId)
      .eq('manuscript_id', params.manuscriptId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    return NextResponse.json({ chapter })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/manuscripts/[manuscriptId]/chapters/[chapterId]
 * Delete a chapter
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { manuscriptId: string; chapterId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', params.chapterId)
      .eq('manuscript_id', params.manuscriptId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
