import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

// GET /api/analytics/script/[scriptId] - Get script performance analytics
export async function GET(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scriptId } = params
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')

    // Verify user owns the script or is a collaborator
    const { data: script } = await supabase
      .from('manuscripts')
      .select('user_id')
      .eq('id', scriptId)
      .single()

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    const isOwner = script.user_id === user.id

    // Check if user is collaborator
    const { data: collaboration } = await supabase
      .from('manuscript_collaborators')
      .select('id')
      .eq('manuscript_id', scriptId)
      .eq('collaborator_id', user.id)
      .single()

    if (!isOwner && !collaboration) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get engagement metrics
    const { data: engagement } = await supabase
      .from('script_engagement_metrics')
      .select('*')
      .eq('script_id', scriptId)
      .single()

    // Get collaboration metrics
    const { data: collabMetrics } = await supabase
      .from('script_collaboration_metrics')
      .select('*')
      .eq('script_id', scriptId)
      .single()

    // Get recent views
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: views } = await supabase
      .from('script_views')
      .select('viewer_id, view_duration_seconds, percentage_read, source, created_at')
      .eq('script_id', scriptId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    // Calculate view stats
    const totalViews = views?.length || 0
    const uniqueViewers = new Set(views?.map(v => v.viewer_id).filter(Boolean)).size
    const avgDuration =
      totalViews > 0
        ? (views?.reduce((sum, v) => sum + (v.view_duration_seconds || 0), 0) || 0) / totalViews
        : 0
    const avgPercentage =
      totalViews > 0
        ? (views?.reduce((sum, v) => sum + (v.percentage_read || 0), 0) || 0) / totalViews
        : 0

    // Views by source
    const viewsBySource =
      views?.reduce(
        (acc, view) => {
          const source = view.source || 'direct'
          acc[source] = (acc[source] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ) || {}

    // Daily views trend
    const dailyViews =
      views?.reduce(
        (acc, view) => {
          const date = new Date(view.created_at).toISOString().split('T')[0]
          acc[date] = (acc[date] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ) || {}

    // Get top viewers (if owner)
    let topViewers: Array<{
      id: string
      display_name: string | null
      username: string | null
      avatar_url: string | null
      viewCount: number
    }> = []

    if (isOwner) {
      const viewerCounts =
        views?.reduce(
          (acc, view) => {
            if (view.viewer_id) {
              acc[view.viewer_id] = (acc[view.viewer_id] || 0) + 1
            }
            return acc
          },
          {} as Record<string, number>
        ) || {}

      const topViewerIds = Object.entries(viewerCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id]) => id)

      if (topViewerIds.length > 0) {
        const { data: viewers } = await supabase
          .from('users')
          .select('id, display_name, username, avatar_url')
          .in('id', topViewerIds)

        topViewers =
          viewers?.map(viewer => ({
            ...viewer,
            viewCount: viewerCounts[viewer.id],
          })) || []
      }
    }

    return NextResponse.json({
      engagement: {
        totalViews: engagement?.total_views || 0,
        uniqueViewers: engagement?.unique_viewers || 0,
        avgViewDuration: engagement?.avg_view_duration_seconds || 0,
        avgPercentageRead: engagement?.avg_percentage_read || 0,
        totalLikes: engagement?.total_likes || 0,
        totalComments: engagement?.total_comments || 0,
        totalShares: engagement?.total_shares || 0,
        engagementRate: engagement?.engagement_rate || 0,
        viralityScore: engagement?.virality_score || 0,
        trendingScore: engagement?.trending_score || 0,
      },
      collaboration: {
        totalCollaborators: collabMetrics?.total_collaborators || 0,
        totalEdits: collabMetrics?.total_edits || 0,
        totalComments: collabMetrics?.total_comments_internal || 0,
        avgResponseTimeHours: collabMetrics?.avg_response_time_hours || 0,
        healthScore: collabMetrics?.collaboration_health_score || 0,
      },
      recentStats: {
        totalViews,
        uniqueViewers,
        avgDuration: Math.round(avgDuration),
        avgPercentage: Math.round(avgPercentage),
      },
      viewsBySource,
      dailyViews,
      topViewers: isOwner ? topViewers : [],
    })
  } catch (error) {
    logger.error('Error fetching script analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/analytics/script/[scriptId] - Track script view
export async function POST(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { scriptId } = params
    const { viewDuration, percentageRead, source, referrer } = await request.json()

    // Track view
    const { error } = await supabase.from('script_views').insert({
      script_id: scriptId,
      viewer_id: user?.id || null,
      view_duration_seconds: viewDuration,
      percentage_read: percentageRead,
      source: source || 'direct',
      referrer,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error tracking script view:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
