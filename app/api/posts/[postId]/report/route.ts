import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

// Force dynamic route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = params
    const body = await request.json()
    const { reason, description } = body

    if (
      !reason ||
      !['spam', 'harassment', 'inappropriate', 'misinformation', 'copyright', 'other'].includes(
        reason
      )
    ) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
    }

    // Check if post exists
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user already reported this post
    const { data: existingReport } = await supabase
      .from('post_reports')
      .select('id')
      .eq('post_id', postId)
      .eq('reporter_id', user.id)
      .single()

    if (existingReport) {
      return NextResponse.json({ error: 'You have already reported this post' }, { status: 400 })
    }

    // Create report
    const { data: report, error: createError } = await supabase
      .from('post_reports')
      .insert({
        post_id: postId,
        reporter_id: user.id,
        reason,
        description: description || null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create report:', createError)
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('Report post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
