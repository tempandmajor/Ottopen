import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

// GET /api/analytics/user - Get comprehensive user analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || user.id
    const days = parseInt(searchParams.get('days') || '30')

    // Only allow users to view their own analytics (unless admin)
    if (userId !== user.id) {
      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (currentUser?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get engagement metrics
    const { data: engagement } = await supabase
      .from('user_engagement_metrics')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get recent activity (last N days)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: recentActivity } = await supabase
      .from('user_activity_log')
      .select('activity_type, created_at, metadata')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(100)

    // Get session stats
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('duration_seconds, pages_viewed, actions_taken, session_start')
      .eq('user_id', userId)
      .gte('session_start', startDate.toISOString())
      .order('session_start', { ascending: false })

    // Calculate session stats
    const totalSessions = sessions?.length || 0
    const avgDuration =
      totalSessions > 0
        ? (sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0) / totalSessions
        : 0
    const avgPages =
      totalSessions > 0
        ? (sessions?.reduce((sum, s) => sum + (s.pages_viewed || 0), 0) || 0) / totalSessions
        : 0
    const avgActions =
      totalSessions > 0
        ? (sessions?.reduce((sum, s) => sum + (s.actions_taken || 0), 0) || 0) / totalSessions
        : 0

    // Get feature usage
    const { data: features } = await supabase
      .from('feature_usage')
      .select('feature_name, usage_count, last_used_at')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false })
      .limit(20)

    // Activity by type
    const activityByType =
      recentActivity?.reduce(
        (acc, activity) => {
          acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ) || {}

    // Daily activity trend
    const dailyActivity =
      recentActivity?.reduce(
        (acc, activity) => {
          const date = new Date(activity.created_at).toISOString().split('T')[0]
          acc[date] = (acc[date] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ) || {}

    return NextResponse.json({
      engagement: {
        totalSessions: engagement?.total_sessions || 0,
        totalTimeSeconds: engagement?.total_time_seconds || 0,
        avgSessionDuration: engagement?.avg_session_duration_seconds || 0,
        totalActions: engagement?.total_actions || 0,
        engagementLevel: engagement?.engagement_level || 'low',
        retentionScore: engagement?.retention_score || 0,
        lastActiveAt: engagement?.last_active_at,
      },
      recentStats: {
        totalSessions,
        avgDuration: Math.round(avgDuration),
        avgPages: Math.round(avgPages),
        avgActions: Math.round(avgActions),
      },
      activityByType,
      dailyActivity,
      topFeatures: features || [],
      recentActivity: recentActivity?.slice(0, 20) || [],
    })
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/analytics/user - Track user activity
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { activityType, entityType, entityId, metadata } = await request.json()

    if (!activityType) {
      return NextResponse.json({ error: 'Activity type is required' }, { status: 400 })
    }

    // Log activity
    const { error } = await supabase.from('user_activity_log').insert({
      user_id: user.id,
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata || {},
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
