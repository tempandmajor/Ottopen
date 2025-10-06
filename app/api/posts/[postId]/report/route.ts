import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { logError } from '@/src/lib/errors'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { z } from 'zod'

// Force dynamic route
export const dynamic = 'force-dynamic'

const reportSchema = z.object({
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'misinformation', 'copyright', 'other']),
  description: z.string().max(1000).optional(),
})

async function handleReportPost(request: NextRequest, { params }: { params: { postId: string } }) {
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

    // SEC-FIX: Validate input with Zod
    const validationResult = reportSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { reason, description } = validationResult.data

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
      logError(createError, { context: 'POST /api/posts/[postId]/report - create' })
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    return NextResponse.json({ success: true, report })
  } catch (error) {
    logError(error, { context: 'POST /api/posts/[postId]/report' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = createRateLimitedHandler('api', handleReportPost)
