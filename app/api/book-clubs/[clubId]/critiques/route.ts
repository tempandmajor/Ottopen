import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function handleGetCritiques(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') || 'recent'
    const status = searchParams.get('status')

    const supabase = createServerSupabaseClient()

    // Check membership
    const { data: membership } = await supabase
      .from('club_memberships')
      .select('id')
      .eq('club_id', params.clubId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a club member' }, { status: 403 })
    }

    let query = supabase
      .from('critiques')
      .select(
        `
        *,
        author:author_id(id, name),
        critique_count:critique_reviews(count)
      `
      )
      .eq('club_id', params.clubId)

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Sort
    switch (sortBy) {
      case 'deadline':
        query = query.order('deadline', { ascending: true })
        break
      case 'credits':
        query = query.order('credit_cost', { ascending: false })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data: critiques, error } = await query

    if (error) throw error

    // Transform data
    const transformedCritiques = critiques?.map(critique => ({
      ...critique,
      critique_count: critique.critique_count?.[0]?.count || 0,
    }))

    return NextResponse.json({
      success: true,
      critiques: transformedCritiques,
    })
  } catch (error: any) {
    console.error('Get critiques error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch critiques', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = createRateLimitedHandler('api', handleGetCritiques)
