import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

async function handleSubmitReview(
  request: NextRequest,
  { params }: { params: { clubId: string; critiqueId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ratings, overallFeedback, inlineComments } = body

    if (!ratings || !overallFeedback) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get critique details and check membership
    const { data: critique, error: critiqueError } = await supabase
      .from('critiques')
      .select('author_id, credit_cost, status')
      .eq('id', params.critiqueId)
      .eq('club_id', params.clubId)
      .single()

    if (critiqueError || !critique) {
      return NextResponse.json({ error: 'Critique not found' }, { status: 404 })
    }

    // Can't review own submission
    if (critique.author_id === user.id) {
      return NextResponse.json({ error: 'Cannot review your own submission' }, { status: 400 })
    }

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from('critique_reviews')
      .select('id')
      .eq('critique_id', params.critiqueId)
      .eq('reviewer_id', user.id)
      .single()

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this submission' },
        { status: 400 }
      )
    }

    // Check membership
    const { data: membership } = await supabase
      .from('club_memberships')
      .select('credits')
      .eq('club_id', params.clubId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a club member' }, { status: 403 })
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('critique_reviews')
      .insert({
        critique_id: params.critiqueId,
        reviewer_id: user.id,
        ratings,
        overall_feedback: overallFeedback,
        inline_comments: inlineComments || null,
      })
      .select()
      .single()

    if (reviewError) throw reviewError

    // Award credit to reviewer
    const newCredits = membership.credits + 1
    await supabase
      .from('club_memberships')
      .update({ credits: newCredits })
      .eq('club_id', params.clubId)
      .eq('user_id', user.id)

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      club_id: params.clubId,
      amount: 1,
      transaction_type: 'critique_given',
      description: 'Gave critique to fellow writer',
    })

    // Update critique count and status
    const { data: reviewCount } = await supabase
      .from('critique_reviews')
      .select('id', { count: 'exact' })
      .eq('critique_id', params.critiqueId)

    const count = reviewCount?.length || 0
    let newStatus = critique.status

    if (count >= 1 && critique.status === 'open') {
      newStatus = 'in_progress'
    }
    if (count >= 3 && critique.status === 'in_progress') {
      newStatus = 'completed'
    }

    if (newStatus !== critique.status) {
      await supabase.from('critiques').update({ status: newStatus }).eq('id', params.critiqueId)
    }

    // Create notification for author
    await supabase.from('notifications').insert({
      user_id: critique.author_id,
      type: 'critique_received',
      title: 'New Critique Received',
      message: 'Someone has reviewed your submission',
      action_url: `/clubs/${params.clubId}/critiques/${params.critiqueId}`,
    })

    return NextResponse.json({
      success: true,
      review,
      creditsEarned: 1,
      newCredits,
    })
  } catch (error: any) {
    logger.error('Submit review error:', error)
    return NextResponse.json(
      { error: 'Failed to submit review', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = createRateLimitedHandler('api', handleSubmitReview)
