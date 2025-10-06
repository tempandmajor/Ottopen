import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { logError } from '@/src/lib/errors'

export const dynamic = 'force-dynamic'

/**
 * POST /api/contracts/[contractId]/review
 * Submit a review for a completed contract
 */
export async function POST(request: NextRequest, { params }: { params: { contractId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      rating,
      reviewText,
      communicationRating,
      qualityRating,
      professionalismRating,
      timelinessRating,
    } = await request.json()

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Get contract
    const { data: contract } = await supabase
      .from('job_contracts')
      .select('*')
      .eq('id', params.contractId)
      .single()

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Verify user is part of the contract
    const isClient = contract.client_id === user.id
    const isWriter = contract.writer_id === user.id

    if (!isClient && !isWriter) {
      return NextResponse.json({ error: 'You are not part of this contract' }, { status: 403 })
    }

    // Determine reviewee
    const revieweeId = isClient ? contract.writer_id : contract.client_id

    // Check if contract is completed
    if (contract.payment_status !== 'released') {
      return NextResponse.json({ error: 'Can only review completed contracts' }, { status: 400 })
    }

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from('job_reviews')
      .select('id')
      .eq('contract_id', params.contractId)
      .eq('reviewer_id', user.id)
      .single()

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this contract' },
        { status: 400 }
      )
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('job_reviews')
      .insert({
        contract_id: params.contractId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        review_text: reviewText,
        communication_rating: communicationRating,
        quality_rating: qualityRating,
        professionalism_rating: professionalismRating,
        timeliness_rating: timelinessRating,
        is_writer_review: isClient, // If client is reviewing, they're reviewing the writer
      })
      .select()
      .single()

    if (reviewError) {
      logError(reviewError, { context: 'create_review' })
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      review,
    })
  } catch (error: any) {
    logError(error, { context: 'create_review' })
    return NextResponse.json({ error: error.message || 'Failed to create review' }, { status: 500 })
  }
}

/**
 * PUT /api/contracts/[contractId]/review
 * Respond to a review
 */
export async function PUT(request: NextRequest, { params }: { params: { contractId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { responseText } = await request.json()

    // Get review where user is the reviewee
    const { data: review, error: reviewError } = await supabase
      .from('job_reviews')
      .update({
        response_text: responseText,
        response_at: new Date().toISOString(),
      })
      .eq('contract_id', params.contractId)
      .eq('reviewee_id', user.id)
      .select()
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found or you are not authorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      review,
    })
  } catch (error: any) {
    logError(error, { context: 'respond_to_review' })
    return NextResponse.json(
      { error: error.message || 'Failed to respond to review' },
      { status: 500 }
    )
  }
}
