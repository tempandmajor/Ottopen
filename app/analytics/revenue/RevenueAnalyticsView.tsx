'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { DollarSign, TrendingUp, ShoppingCart, Eye, Percent } from 'lucide-react'
import { ErrorBoundary } from '@/src/components/error-boundary'

interface RevenueAnalytics {
  summary: {
    totalEarnings: number
    totalScriptsSold: number
    totalViews: number
    avgConversionRate: number
    avgScriptPrice: number
  }
  breakdown: {
    commission: number
    referral: number
    bonus: number
  }
  dailyTrend: Array<{
    date: string
    earnings: number
    scriptsSold: number
    views: number
    conversionRate: number
  }>
  recentPayments: Array<{
    id: string
    payment_type: string
    amount_cents: number
    currency: string
    status: string
    description: string
    created_at: string
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28']

type RevenueAnalyticsViewProps = {
  initialAnalytics?: RevenueAnalytics | null
  defaultDays?: string
}

function RevenueAnalyticsPageContent({
  initialAnalytics,
  defaultDays = '30',
}: RevenueAnalyticsViewProps) {
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(initialAnalytics ?? null)
  const [loading, setLoading] = useState(!initialAnalytics)
  const [timeRange, setTimeRange] = useState(defaultDays)

  useEffect(() => {
    if (!initialAnalytics || timeRange !== defaultDays) {
      fetchAnalytics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/revenue?type=writer&days=${timeRange}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching revenue analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-muted-foreground">No revenue data available</div>
      </div>
    )
  }

  // Prepare chart data
  const breakdownData = [
    { name: 'Commission', value: analytics.breakdown.commission },
    { name: 'Referral', value: analytics.breakdown.referral },
    { name: 'Bonus', value: analytics.breakdown.bonus },
  ].filter(item => item.value > 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenue Analytics</h1>
          <p className="text-muted-foreground">Track your earnings and sales performance</p>
        </div>
        <select
          value={timeRange}
          onChange={e => setTimeRange(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold">
                {formatCurrency(analytics.summary.totalEarnings)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Scripts Sold</p>
              <p className="text-2xl font-bold">{analytics.summary.totalScriptsSold}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{analytics.summary.totalViews.toLocaleString()}</p>
            </div>
            <Eye className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold">
                {analytics.summary.avgConversionRate.toFixed(2)}%
              </p>
            </div>
            <Percent className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Script Price</p>
              <p className="text-2xl font-bold">
                {formatCurrency(analytics.summary.avgScriptPrice)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-indigo-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend">Earnings Trend</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Earnings</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#10b981"
                  name="Earnings ($)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Scripts Sold</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="scriptsSold" fill="#3b82f6" name="Scripts Sold" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Earnings Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={entry => `${entry.name}: ${formatCurrency(entry.value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Sources</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">Commission Earnings</p>
                    <p className="text-sm text-muted-foreground">From script sales</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(analytics.breakdown.commission)}
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">Referral Earnings</p>
                    <p className="text-sm text-muted-foreground">From referrals</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(analytics.breakdown.referral)}
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium">Bonus Earnings</p>
                    <p className="text-sm text-muted-foreground">From bonuses</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.breakdown.bonus)}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Views vs Sales</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="views"
                    stroke="#8b5cf6"
                    name="Views"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="scriptsSold"
                    stroke="#3b82f6"
                    name="Sales"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Conversion Rate Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="conversionRate"
                    stroke="#f59e0b"
                    name="Conversion Rate (%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Payments */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Description</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentPayments.slice(0, 10).map((payment, index) => (
                <tr key={payment.id || index} className="border-b last:border-0">
                  <td className="py-3 px-4">{new Date(payment.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 capitalize">
                    {payment.payment_type.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4">{payment.description || '-'}</td>
                  <td className="py-3 px-4 font-semibold">
                    {formatCurrency(payment.amount_cents / 100)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        payment.status === 'succeeded'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function RevenueAnalyticsView(props: RevenueAnalyticsViewProps) {
  return (
    <ErrorBoundary>
      <RevenueAnalyticsPageContent {...props} />
    </ErrorBoundary>
  )
}
