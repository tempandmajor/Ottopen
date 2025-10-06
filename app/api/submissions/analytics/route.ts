export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || user.id
    const months = parseInt(searchParams.get('months') || '12')

    // Get submission statistics
    const { data: stats, error: statsError } = await supabase
      .from('submission_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is ok
      console.error('Stats error:', statsError)
    }

    // Get submission trends using the database function
    const { data: trends, error: trendsError } = await supabase.rpc('get_submission_trends', {
      p_user_id: userId,
      p_months: months,
    })

    if (trendsError) {
      console.error('Trends error:', trendsError)
    }

    // Get submissions by status
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('status, created_at, manuscript_id')
      .eq('submitter_id', userId)

    if (submissionsError) {
      console.error('Submissions error:', submissionsError)
    }

    // Get manuscripts to get genre and type info
    const manuscriptIds = submissions?.map(s => s.manuscript_id).filter(Boolean) || []
    const { data: manuscripts } = await supabase
      .from('manuscripts')
      .select('id, genre, type')
      .in('id', manuscriptIds)

    // Group submissions by status
    const submissionsByStatus =
      submissions?.reduce(
        (acc, sub) => {
          acc[sub.status] = (acc[sub.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ) || {}

    // Group manuscripts by genre
    const submissionsByGenre =
      manuscripts?.reduce(
        (acc, m) => {
          if (m.genre) {
            acc[m.genre] = (acc[m.genre] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>
      ) || {}

    // Group manuscripts by type
    const submissionsByType =
      manuscripts?.reduce(
        (acc, m) => {
          if (m.type) {
            acc[m.type] = (acc[m.type] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>
      ) || {}

    const analytics = {
      totalSubmissions: stats?.total_submissions || submissions?.length || 0,
      acceptedCount: stats?.accepted_count || 0,
      rejectedCount: stats?.rejected_count || 0,
      pendingCount: stats?.pending_count || 0,
      averageResponseTime: stats?.avg_response_days || null,
      acceptanceRate: stats?.acceptance_rate || 0,
      submissionsByStatus,
      submissionsByGenre,
      submissionsByType,
      monthlyTrends: trends || [],
      lastSubmissionDate: stats?.last_submission_date || null,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
