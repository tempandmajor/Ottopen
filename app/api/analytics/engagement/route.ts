import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

// GET /api/analytics/engagement - Get platform engagement metrics
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    const metricType = searchParams.get('type') || 'all' // 'dau', 'funnel', 'retention', 'feature', 'all'

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let response: any = {}

    // Daily Active Users
    if (metricType === 'dau' || metricType === 'all') {
      const { data: dauData } = await supabase
        .from('daily_active_users')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      const totalUsers = dauData?.[0]?.total_users || 0
      const newUsers = dauData?.reduce((sum, day) => sum + (day.new_users || 0), 0) || 0
      const avgDau =
        dauData?.reduce((sum, day) => sum + (day.total_users || 0), 0) / (dauData?.length || 1) || 0

      response.dailyActiveUsers = {
        trend: dauData || [],
        summary: {
          totalUsers,
          newUsers,
          avgDailyActiveUsers: Math.round(avgDau),
          churnedUsers: dauData?.reduce((sum, day) => sum + (day.churned_users || 0), 0) || 0,
        },
      }
    }

    // Funnel Analytics
    if (metricType === 'funnel' || metricType === 'all') {
      const { data: funnelData } = await supabase
        .from('funnel_events')
        .select('funnel_name, step_name, step_order, completed, time_spent_seconds')
        .gte('created_at', startDate.toISOString())
        .order('funnel_name')
        .order('step_order')

      // Group by funnel and calculate conversion rates
      const funnelsByName =
        funnelData?.reduce(
          (acc, event) => {
            if (!acc[event.funnel_name]) {
              acc[event.funnel_name] = {}
            }
            if (!acc[event.funnel_name][event.step_name]) {
              acc[event.funnel_name][event.step_name] = {
                stepOrder: event.step_order,
                total: 0,
                completed: 0,
                avgTimeSpent: 0,
                totalTime: 0,
              }
            }
            acc[event.funnel_name][event.step_name].total += 1
            if (event.completed) {
              acc[event.funnel_name][event.step_name].completed += 1
            }
            acc[event.funnel_name][event.step_name].totalTime += event.time_spent_seconds || 0
            return acc
          },
          {} as Record<string, any>
        ) || {}

      // Calculate conversion rates and avg time
      const funnels = Object.entries(funnelsByName).map(([funnelName, steps]) => {
        const stepsArray = Object.entries(steps as any)
          .map(([stepName, data]: [string, any]) => ({
            stepName,
            stepOrder: data.stepOrder,
            total: data.total,
            completed: data.completed,
            conversionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
            avgTimeSpent: data.total > 0 ? Math.round(data.totalTime / data.total) : 0,
          }))
          .sort((a, b) => a.stepOrder - b.stepOrder)

        return {
          funnelName,
          steps: stepsArray,
          overallConversion:
            stepsArray.length > 0
              ? (stepsArray[stepsArray.length - 1].completed / stepsArray[0].total) * 100
              : 0,
        }
      })

      response.funnels = funnels
    }

    // Retention Cohorts
    if (metricType === 'retention' || metricType === 'all') {
      const { data: cohorts } = await supabase
        .from('retention_cohorts')
        .select('*')
        .order('cohort_month', { ascending: false })
        .limit(12)

      const retentionData =
        cohorts?.map(cohort => ({
          month: cohort.cohort_month,
          totalUsers: cohort.total_users,
          month1Retention:
            cohort.total_users > 0 ? (cohort.month_1_retained / cohort.total_users) * 100 : 0,
          month2Retention:
            cohort.total_users > 0 ? (cohort.month_2_retained / cohort.total_users) * 100 : 0,
          month3Retention:
            cohort.total_users > 0 ? (cohort.month_3_retained / cohort.total_users) * 100 : 0,
          month6Retention:
            cohort.total_users > 0 ? (cohort.month_6_retained / cohort.total_users) * 100 : 0,
          month12Retention:
            cohort.total_users > 0 ? (cohort.month_12_retained / cohort.total_users) * 100 : 0,
        })) || []

      // Calculate average retention rates
      const avgRetention = {
        month1:
          retentionData.reduce((sum, c) => sum + c.month1Retention, 0) /
          (retentionData.length || 1),
        month3:
          retentionData.reduce((sum, c) => sum + c.month3Retention, 0) /
          (retentionData.length || 1),
        month6:
          retentionData.reduce((sum, c) => sum + c.month6Retention, 0) /
          (retentionData.length || 1),
        month12:
          retentionData.reduce((sum, c) => sum + c.month12Retention, 0) /
          (retentionData.length || 1),
      }

      response.retention = {
        cohorts: retentionData,
        averages: avgRetention,
      }
    }

    // Feature Usage
    if (metricType === 'feature' || metricType === 'all') {
      const { data: featureUsage } = await supabase
        .from('feature_usage')
        .select('feature_name, usage_count, last_used_at')
        .gte('last_used_at', startDate.toISOString())

      // Aggregate by feature
      const featureStats =
        featureUsage?.reduce(
          (acc, usage) => {
            if (!acc[usage.feature_name]) {
              acc[usage.feature_name] = {
                totalUsage: 0,
                uniqueUsers: new Set(),
                lastUsed: usage.last_used_at,
              }
            }
            acc[usage.feature_name].totalUsage += usage.usage_count
            if (usage.last_used_at > acc[usage.feature_name].lastUsed) {
              acc[usage.feature_name].lastUsed = usage.last_used_at
            }
            return acc
          },
          {} as Record<string, any>
        ) || {}

      const topFeatures = Object.entries(featureStats)
        .map(([feature, stats]: [string, any]) => ({
          feature,
          totalUsage: stats.totalUsage,
          lastUsed: stats.lastUsed,
        }))
        .sort((a, b) => b.totalUsage - a.totalUsage)
        .slice(0, 20)

      response.features = {
        topFeatures,
        totalFeatures: Object.keys(featureStats).length,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching engagement metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/analytics/engagement - Track funnel event
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { funnelName, stepName, stepOrder, completed, timeSpent, metadata } = await request.json()

    if (!funnelName || !stepName || stepOrder === undefined) {
      return NextResponse.json(
        { error: 'Funnel name, step name, and step order are required' },
        { status: 400 }
      )
    }

    // Track funnel event
    const { error } = await supabase.from('funnel_events').insert({
      user_id: user?.id || null,
      funnel_name: funnelName,
      step_name: stepName,
      step_order: stepOrder,
      completed: completed || false,
      time_spent_seconds: timeSpent,
      metadata: metadata || {},
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking funnel event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
