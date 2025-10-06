import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

// GET /api/analytics/platform - Get platform-wide statistics (admin only)
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
    const metricType = searchParams.get('type') || 'all' // 'platform', 'content', 'acquisition', 'all'

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    let response: any = {}

    // Platform Metrics
    if (metricType === 'platform' || metricType === 'all') {
      const { data: platformData } = await supabase
        .from('platform_metrics')
        .select('*')
        .gte('date', startDateStr)
        .order('date', { ascending: false })

      const latest = platformData?.[0]
      const totalNewSignups =
        platformData?.reduce((sum, day) => sum + (day.new_signups || 0), 0) || 0
      const avgActiveUsers =
        platformData?.reduce((sum, day) => sum + (day.active_users || 0), 0) /
          (platformData?.length || 1) || 0
      const avgSessionDuration =
        platformData?.reduce((sum, day) => sum + (day.avg_session_duration_seconds || 0), 0) /
          (platformData?.length || 1) || 0

      // Daily trend
      const dailyTrend =
        platformData?.map(day => ({
          date: day.date,
          totalUsers: day.total_users,
          activeUsers: day.active_users,
          newSignups: day.new_signups,
          scriptsCreated: day.scripts_created_today,
          postsCreated: day.posts_created_today,
          messagesSent: day.messages_sent_today,
        })) || []

      // Growth metrics
      const userGrowthRate =
        platformData && platformData.length > 1
          ? ((platformData[0].total_users - platformData[platformData.length - 1].total_users) /
              platformData[platformData.length - 1].total_users) *
            100
          : 0

      response.platform = {
        summary: {
          totalUsers: latest?.total_users || 0,
          activeUsers: latest?.active_users || 0,
          totalScripts: latest?.total_scripts || 0,
          totalPosts: latest?.total_posts || 0,
          totalMessages: latest?.total_messages || 0,
          totalRevenue: (latest?.total_revenue_cents || 0) / 100,
          avgSessionDuration: Math.round(avgSessionDuration),
          bounceRate: latest?.bounce_rate || 0,
          retentionRate: latest?.user_retention_rate || 0,
          userGrowthRate: parseFloat(userGrowthRate.toFixed(2)),
        },
        period: {
          newSignups: totalNewSignups,
          avgActiveUsers: Math.round(avgActiveUsers),
        },
        dailyTrend,
      }
    }

    // Content Metrics
    if (metricType === 'content' || metricType === 'all') {
      const { data: contentData } = await supabase
        .from('content_metrics')
        .select('*')
        .gte('date', startDateStr)
        .order('date', { ascending: false })

      const latest = contentData?.[0]
      const totalViews = contentData?.reduce((sum, day) => sum + (day.total_views || 0), 0) || 0
      const totalLikes = contentData?.reduce((sum, day) => sum + (day.total_likes || 0), 0) || 0
      const totalComments =
        contentData?.reduce((sum, day) => sum + (day.total_comments || 0), 0) || 0
      const totalShares = contentData?.reduce((sum, day) => sum + (day.total_shares || 0), 0) || 0
      const avgEngagementRate =
        contentData?.reduce((sum, day) => sum + (day.avg_engagement_rate || 0), 0) /
          (contentData?.length || 1) || 0

      // Daily trend
      const dailyTrend =
        contentData?.map(day => ({
          date: day.date,
          views: day.total_views,
          likes: day.total_likes,
          comments: day.total_comments,
          shares: day.total_shares,
          engagementRate: day.avg_engagement_rate,
          trendingScripts: day.trending_scripts,
          viralPosts: day.viral_posts,
        })) || []

      response.content = {
        summary: {
          totalViews,
          totalLikes,
          totalComments,
          totalShares,
          avgEngagementRate: parseFloat(avgEngagementRate.toFixed(2)),
          trendingScripts: latest?.trending_scripts || 0,
          viralPosts: latest?.viral_posts || 0,
        },
        dailyTrend,
      }
    }

    // Acquisition Metrics
    if (metricType === 'acquisition' || metricType === 'all') {
      const { data: acquisitionData } = await supabase
        .from('acquisition_metrics')
        .select('*')
        .gte('date', startDateStr)
        .order('date', { ascending: false })

      // Aggregate by source
      const bySource =
        acquisitionData?.reduce(
          (acc, metric) => {
            if (!acc[metric.source]) {
              acc[metric.source] = {
                signups: 0,
                conversions: 0,
                cost: 0,
                revenue: 0,
              }
            }
            acc[metric.source].signups += metric.signups || 0
            acc[metric.source].conversions += metric.conversions || 0
            acc[metric.source].cost += metric.cost_cents || 0
            acc[metric.source].revenue += metric.revenue_cents || 0
            return acc
          },
          {} as Record<string, any>
        ) || {}

      const sourceBreakdown = Object.entries(bySource)
        .map(([source, data]: [string, any]) => ({
          source,
          signups: data.signups,
          conversions: data.conversions,
          conversionRate: data.signups > 0 ? (data.conversions / data.signups) * 100 : 0,
          cost: data.cost / 100,
          revenue: data.revenue / 100,
          roi: data.cost > 0 ? ((data.revenue - data.cost) / data.cost) * 100 : 0,
        }))
        .sort((a, b) => b.signups - a.signups)

      // Aggregate by medium
      const byMedium =
        acquisitionData?.reduce(
          (acc, metric) => {
            const medium = metric.medium || 'unknown'
            if (!acc[medium]) {
              acc[medium] = {
                signups: 0,
                conversions: 0,
              }
            }
            acc[medium].signups += metric.signups || 0
            acc[medium].conversions += metric.conversions || 0
            return acc
          },
          {} as Record<string, any>
        ) || {}

      const mediumBreakdown = Object.entries(byMedium)
        .map(([medium, data]: [string, any]) => ({
          medium,
          signups: data.signups,
          conversions: data.conversions,
          conversionRate: data.signups > 0 ? (data.conversions / data.signups) * 100 : 0,
        }))
        .sort((a, b) => b.signups - a.signups)

      // Top campaigns
      const topCampaigns =
        acquisitionData
          ?.filter(m => m.campaign)
          .sort((a, b) => (b.signups || 0) - (a.signups || 0))
          .slice(0, 10)
          .map(campaign => ({
            campaign: campaign.campaign,
            source: campaign.source,
            medium: campaign.medium,
            signups: campaign.signups,
            conversions: campaign.conversions,
            conversionRate:
              campaign.signups > 0 ? (campaign.conversions / campaign.signups) * 100 : 0,
            cost: (campaign.cost_cents || 0) / 100,
            revenue: (campaign.revenue_cents || 0) / 100,
            roi: campaign.roi || 0,
          })) || []

      const totalSignups = acquisitionData?.reduce((sum, m) => sum + (m.signups || 0), 0) || 0
      const totalConversions =
        acquisitionData?.reduce((sum, m) => sum + (m.conversions || 0), 0) || 0
      const totalCost = acquisitionData?.reduce((sum, m) => sum + (m.cost_cents || 0), 0) || 0
      const totalRevenue = acquisitionData?.reduce((sum, m) => sum + (m.revenue_cents || 0), 0) || 0

      response.acquisition = {
        summary: {
          totalSignups,
          totalConversions,
          conversionRate: totalSignups > 0 ? (totalConversions / totalSignups) * 100 : 0,
          totalCost: totalCost / 100,
          totalRevenue: totalRevenue / 100,
          roi: totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0,
        },
        bySource: sourceBreakdown,
        byMedium: mediumBreakdown,
        topCampaigns,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching platform analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/analytics/platform - Track acquisition event
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { source, medium, campaign, signups, conversions, costCents, revenueCents } =
      await request.json()

    if (!source) {
      return NextResponse.json({ error: 'Source is required' }, { status: 400 })
    }

    // Verify permission (admin only)
    if (user) {
      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (currentUser?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const today = new Date().toISOString().split('T')[0]
    const roi =
      costCents && costCents > 0 ? (((revenueCents || 0) - costCents) / costCents) * 100 : 0

    // Track acquisition metric
    const { error } = await supabase.from('acquisition_metrics').upsert(
      {
        date: today,
        source,
        medium: medium || null,
        campaign: campaign || null,
        signups: signups || 0,
        conversions: conversions || 0,
        cost_cents: costCents || 0,
        revenue_cents: revenueCents || 0,
        roi: parseFloat(roi.toFixed(2)),
      },
      {
        onConflict: 'date,source,medium,campaign',
      }
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking acquisition metric:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
