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
  Area,
  AreaChart,
} from 'recharts'
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Eye,
  MessageSquare,
  FileText,
  ShoppingCart,
  Target,
} from 'lucide-react'

interface PlatformAnalytics {
  platform?: {
    summary: {
      totalUsers: number
      activeUsers: number
      totalScripts: number
      totalPosts: number
      totalMessages: number
      totalRevenue: number
      avgSessionDuration: number
      bounceRate: number
      retentionRate: number
      userGrowthRate: number
    }
    period: {
      newSignups: number
      avgActiveUsers: number
    }
    dailyTrend: Array<{
      date: string
      totalUsers: number
      activeUsers: number
      newSignups: number
      scriptsCreated: number
      postsCreated: number
      messagesSent: number
    }>
  }
  content?: {
    summary: {
      totalViews: number
      totalLikes: number
      totalComments: number
      totalShares: number
      avgEngagementRate: number
      trendingScripts: number
      viralPosts: number
    }
    dailyTrend: Array<{
      date: string
      views: number
      likes: number
      comments: number
      shares: number
      engagementRate: number
      trendingScripts: number
      viralPosts: number
    }>
  }
  acquisition?: {
    summary: {
      totalSignups: number
      totalConversions: number
      conversionRate: number
      totalCost: number
      totalRevenue: number
      roi: number
    }
    bySource: Array<{
      source: string
      signups: number
      conversions: number
      conversionRate: number
      cost: number
      revenue: number
      roi: number
    }>
    byMedium: Array<{
      medium: string
      signups: number
      conversions: number
      conversionRate: number
    }>
    topCampaigns: Array<{
      campaign: string
      source: string
      medium: string
      signups: number
      conversions: number
      conversionRate: number
      cost: number
      revenue: number
      roi: number
    }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics>({})
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [activeTab, setActiveTab] = useState('platform')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange, activeTab])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/platform?days=${timeRange}&type=${activeTab}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground">Admin dashboard for platform-wide metrics</p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
        </TabsList>

        {/* Platform Metrics */}
        <TabsContent value="platform" className="space-y-4">
          {analytics.platform && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">
                        {analytics.platform.summary.totalUsers.toLocaleString()}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    +{analytics.platform.summary.userGrowthRate.toFixed(1)}% growth
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Users</p>
                      <p className="text-2xl font-bold">
                        {analytics.platform.summary.activeUsers.toLocaleString()}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Avg: {analytics.platform.period.avgActiveUsers.toLocaleString()}/day
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(analytics.platform.summary.totalRevenue)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Retention Rate</p>
                      <p className="text-2xl font-bold">
                        {analytics.platform.summary.retentionRate.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Bounce: {analytics.platform.summary.bounceRate.toFixed(1)}%
                  </p>
                </Card>
              </div>

              {/* Content Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Scripts</p>
                      <p className="text-2xl font-bold">
                        {analytics.platform.summary.totalScripts.toLocaleString()}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-indigo-500" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Posts</p>
                      <p className="text-2xl font-bold">
                        {analytics.platform.summary.totalPosts.toLocaleString()}
                      </p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-orange-500" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">New Signups</p>
                      <p className="text-2xl font-bold">
                        {analytics.platform.period.newSignups.toLocaleString()}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-teal-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Last {timeRange} days</p>
                </Card>
              </div>

              {/* Charts */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">User Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.platform.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="totalUsers"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      name="Total Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="activeUsers"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      name="Active Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Daily Signups</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.platform.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="newSignups" fill="#8b5cf6" name="New Signups" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Content Creation</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analytics.platform.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="scriptsCreated"
                        stroke="#6366f1"
                        name="Scripts"
                      />
                      <Line type="monotone" dataKey="postsCreated" stroke="#f59e0b" name="Posts" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Content Metrics */}
        <TabsContent value="content" className="space-y-4">
          {analytics.content && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                      <p className="text-2xl font-bold">
                        {analytics.content.summary.totalViews.toLocaleString()}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-500" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Engagement Rate</p>
                      <p className="text-2xl font-bold">
                        {analytics.content.summary.avgEngagementRate.toFixed(2)}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Trending Scripts</p>
                      <p className="text-2xl font-bold">
                        {analytics.content.summary.trendingScripts}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Viral Posts</p>
                      <p className="text-2xl font-bold">{analytics.content.summary.viralPosts}</p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-500" />
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Engagement Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.content.dailyTrend}>
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
                      stroke="#3b82f6"
                      name="Views"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="likes"
                      stroke="#10b981"
                      name="Likes"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="comments"
                      stroke="#f59e0b"
                      name="Comments"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="engagementRate"
                      stroke="#8b5cf6"
                      name="Engagement %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Acquisition Metrics */}
        <TabsContent value="acquisition" className="space-y-4">
          {analytics.acquisition && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Signups</p>
                      <p className="text-2xl font-bold">
                        {analytics.acquisition.summary.totalSignups.toLocaleString()}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Conversion: {analytics.acquisition.summary.conversionRate.toFixed(2)}%
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(analytics.acquisition.summary.totalRevenue)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cost: {formatCurrency(analytics.acquisition.summary.totalCost)}
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">ROI</p>
                      <p className="text-2xl font-bold">
                        {analytics.acquisition.summary.roi.toFixed(1)}%
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Signups by Source</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.acquisition.bySource.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={entry => `${entry.source}: ${entry.signups}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="signups"
                      >
                        {analytics.acquisition.bySource.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">ROI by Source</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.acquisition.bySource.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                      <Bar dataKey="roi" fill="#10b981" name="ROI %" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Campaigns</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Campaign</th>
                        <th className="text-left py-3 px-4">Source</th>
                        <th className="text-left py-3 px-4">Signups</th>
                        <th className="text-left py-3 px-4">Conversion</th>
                        <th className="text-left py-3 px-4">Cost</th>
                        <th className="text-left py-3 px-4">Revenue</th>
                        <th className="text-left py-3 px-4">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.acquisition.topCampaigns.map((campaign, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 px-4 font-medium">{campaign.campaign}</td>
                          <td className="py-3 px-4">{campaign.source}</td>
                          <td className="py-3 px-4">{campaign.signups}</td>
                          <td className="py-3 px-4">{campaign.conversionRate.toFixed(2)}%</td>
                          <td className="py-3 px-4">{formatCurrency(campaign.cost)}</td>
                          <td className="py-3 px-4">{formatCurrency(campaign.revenue)}</td>
                          <td className="py-3 px-4">
                            <span className={campaign.roi > 0 ? 'text-green-600' : 'text-red-600'}>
                              {campaign.roi.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
