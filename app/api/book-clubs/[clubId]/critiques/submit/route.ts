import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function handleSubmitCritique(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, excerpt, genre, creditCost, deadline } = body

    if (!title || !excerpt || !creditCost || !deadline) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate word count
    const wordCount = excerpt.trim().split(/\s+/).filter(Boolean).length
    if (wordCount < 1000 || wordCount > 5000) {
      return NextResponse.json(
        { error: 'Excerpt must be between 1,000 and 5,000 words' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

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

    // Check credits
    if (membership.credits < creditCost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    // Create critique submission
    const { data: critique, error: critiqueError } = await supabase
      .from('critiques')
      .insert({
        club_id: params.clubId,
        author_id: user.id,
        title,
        excerpt,
        genre,
        credit_cost: creditCost,
        deadline,
        word_count: wordCount,
        status: 'open',
      })
      .select()
      .single()

    if (critiqueError) throw critiqueError

    // Deduct credits
    const { error: updateError } = await supabase
      .from('club_memberships')
      .update({ credits: membership.credits - creditCost })
      .eq('club_id', params.clubId)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      club_id: params.clubId,
      amount: -creditCost,
      transaction_type: 'critique_submission',
      description: `Submitted "${title}" for critique`,
    })

    return NextResponse.json({
      success: true,
      critique,
      creditsRemaining: membership.credits - creditCost,
    })
  } catch (error: any) {
    console.error('Submit critique error:', error)
    return NextResponse.json(
      { error: 'Failed to submit for critique', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = createRateLimitedHandler('api', handleSubmitCritique)
