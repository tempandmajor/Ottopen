import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

// GET /api/analytics/revenue - Get revenue analytics
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
    const type = searchParams.get('type') || 'writer' // 'writer' or 'platform'

    // Check permissions
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = currentUser?.role === 'admin'
    const isOwnData = userId === user.id

    if (type === 'platform' && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!isOwnData && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    if (type === 'writer') {
      // Writer earnings analytics
      const { data: earnings } = await supabase
        .from('writer_earnings_analytics')
        .select('*')
        .eq('writer_id', userId)
        .gte('date', startDateStr)
        .order('date', { ascending: false })

      // Calculate totals
      const totalEarnings =
        earnings?.reduce((sum, day) => sum + (day.total_earnings_cents || 0), 0) || 0
      const totalCommission =
        earnings?.reduce((sum, day) => sum + (day.commission_earnings_cents || 0), 0) || 0
      const totalReferral =
        earnings?.reduce((sum, day) => sum + (day.referral_earnings_cents || 0), 0) || 0
      const totalBonus =
        earnings?.reduce((sum, day) => sum + (day.bonus_earnings_cents || 0), 0) || 0
      const totalScriptsSold = earnings?.reduce((sum, day) => sum + (day.scripts_sold || 0), 0) || 0
      const totalViews = earnings?.reduce((sum, day) => sum + (day.total_views || 0), 0) || 0

      const avgConversionRate = totalViews > 0 ? (totalScriptsSold / totalViews) * 100 : 0
      const avgScriptPrice = totalScriptsSold > 0 ? totalEarnings / totalScriptsSold : 0

      // Daily earnings trend
      const dailyTrend =
        earnings?.map(day => ({
          date: day.date,
          earnings: day.total_earnings_cents / 100, // Convert to dollars
          scriptsSold: day.scripts_sold,
          views: day.total_views,
          conversionRate: day.conversion_rate,
        })) || []

      // Earnings breakdown
      const breakdown = {
        commission: totalCommission / 100,
        referral: totalReferral / 100,
        bonus: totalBonus / 100,
      }

      // Get payment history
      const { data: payments } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

      return NextResponse.json({
        summary: {
          totalEarnings: totalEarnings / 100,
          totalScriptsSold,
          totalViews,
          avgConversionRate: parseFloat(avgConversionRate.toFixed(2)),
          avgScriptPrice: avgScriptPrice / 100,
        },
        breakdown,
        dailyTrend,
        recentPayments: payments || [],
      })
    } else if (type === 'platform') {
      // Platform revenue analytics (admin only)
      const { data: revenue } = await supabase
        .from('revenue_analytics')
        .select('*')
        .gte('date', startDateStr)
        .order('date', { ascending: false })

      // Calculate totals
      const totalRevenue =
        revenue?.reduce((sum, day) => sum + (day.total_revenue_cents || 0), 0) || 0
      const totalSubscriptionRevenue =
        revenue?.reduce((sum, day) => sum + (day.subscription_revenue_cents || 0), 0) || 0
      const totalOneTimeRevenue =
        revenue?.reduce((sum, day) => sum + (day.one_time_payment_revenue_cents || 0), 0) || 0
      const totalRefunds = revenue?.reduce((sum, day) => sum + (day.refunds_cents || 0), 0) || 0
      const netRevenue = revenue?.reduce((sum, day) => sum + (day.net_revenue_cents || 0), 0) || 0

      const newSubscriptions =
        revenue?.reduce((sum, day) => sum + (day.new_subscriptions || 0), 0) || 0
      const cancelledSubscriptions =
        revenue?.reduce((sum, day) => sum + (day.cancelled_subscriptions || 0), 0) || 0
      const activeSubscriptions = revenue?.[0]?.active_subscriptions || 0
      const currentMRR = revenue?.[0]?.mrr_cents || 0
      const currentARR = revenue?.[0]?.arr_cents || 0

      // Daily revenue trend
      const dailyTrend =
        revenue?.map(day => ({
          date: day.date,
          totalRevenue: day.total_revenue_cents / 100,
          subscriptionRevenue: day.subscription_revenue_cents / 100,
          oneTimeRevenue: day.one_time_payment_revenue_cents / 100,
          refunds: day.refunds_cents / 100,
          netRevenue: day.net_revenue_cents / 100,
          newSubscriptions: day.new_subscriptions,
          cancelledSubscriptions: day.cancelled_subscriptions,
        })) || []

      // Revenue breakdown
      const breakdown = {
        subscription: totalSubscriptionRevenue / 100,
        oneTime: totalOneTimeRevenue / 100,
        refunds: totalRefunds / 100,
      }

      // Growth metrics
      const growthRate =
        revenue && revenue.length > 1
          ? ((revenue[0].total_revenue_cents - revenue[revenue.length - 1].total_revenue_cents) /
              revenue[revenue.length - 1].total_revenue_cents) *
            100
          : 0

      return NextResponse.json({
        summary: {
          totalRevenue: totalRevenue / 100,
          netRevenue: netRevenue / 100,
          activeSubscriptions,
          mrr: currentMRR / 100,
          arr: currentARR / 100,
          growthRate: parseFloat(growthRate.toFixed(2)),
        },
        breakdown,
        subscriptions: {
          new: newSubscriptions,
          cancelled: cancelledSubscriptions,
          active: activeSubscriptions,
          churnRate:
            activeSubscriptions > 0 ? (cancelledSubscriptions / activeSubscriptions) * 100 : 0,
        },
        dailyTrend,
      })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    logger.error('Error fetching revenue analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/analytics/revenue - Track payment (internal use / webhook)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const {
      userId,
      paymentType,
      amountCents,
      currency,
      stripePaymentId,
      status,
      description,
      metadata,
    } = await request.json()

    if (!userId || !paymentType || !amountCents || !status) {
      return NextResponse.json(
        { error: 'User ID, payment type, amount, and status are required' },
        { status: 400 }
      )
    }

    // Verify permission (admin or webhook)
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

    // Track payment
    const { error } = await supabase.from('payment_history').insert({
      user_id: userId,
      payment_type: paymentType,
      amount_cents: amountCents,
      currency: currency || 'USD',
      stripe_payment_id: stripePaymentId,
      status,
      description,
      metadata: metadata || {},
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error tracking payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
