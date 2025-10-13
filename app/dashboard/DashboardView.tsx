'use client'
import { Navigation } from '@/src/components/navigation'

import { PostCard } from '@/src/components/post-card'
import { AuthorCard } from '@/src/components/author-card'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Progress } from '@/src/components/ui/progress'
import { WelcomeModal } from '@/src/components/WelcomeModal'
import { OnboardingTour, type TourStep } from '@/src/components/onboarding-tour'
import { StripeEarningsCard } from '@/src/components/dashboard/stripe-earnings-card'
import {
  BookOpen,
  Users,
  Heart,
  MessageCircle,
  Target,
  Award,
  Eye,
  PenTool,
  Calendar,
  Plus,
  Edit3,
  FileText,
  Send,
  Bell,
  TrendingUp,
  Zap,
  Clock,
} from 'lucide-react'
import type {
  Post,
  User,
  WritingGoal,
  UserStatistics,
  User as SupabaseUser,
} from '@/src/lib/supabase'
import type { User as AuthUser } from '@supabase/supabase-js'
import Link from 'next/link'

// Extended User type for dashboard display with computed stats
type UserWithStats = User & {
  works?: number
  followers?: number
}

interface DashboardViewProps {
  user: (AuthUser & { profile?: SupabaseUser }) | null
  stats: {
    totalWorks: number
    totalFollowers: number
    totalLikes: number
    totalViews: number
    wordsThisMonth: number
    postsThisMonth: number
    currentStreak: number
  }
  recentActivity: Post[]
  suggestedAuthors: UserWithStats[]
  writingGoals: WritingGoal[]
  userStatistics: UserStatistics | null
  stripeData?: {
    stripe_customer_id?: string | null
    stripe_connect_account_id?: string | null
    stripe_connect_onboarded?: boolean | null
    stripe_connect_charges_enabled?: boolean | null
    stripe_connect_payouts_enabled?: boolean | null
    subscription_status?: string | null
    subscription_tier?: string | null
    subscription_current_period_end?: string | null
  } | null
}

export function DashboardView({
  user,
  stats,
  recentActivity,
  suggestedAuthors,
  writingGoals,
  userStatistics,
  stripeData,
}: DashboardViewProps) {
  const weeklyGoal = writingGoals.find(g => g.goal_type === 'weekly_words')
  const progressPercentage = weeklyGoal
    ? (weeklyGoal.current_value / weeklyGoal.target_value) * 100
    : 0

  // Onboarding tour steps
  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="quick-actions"]',
      title: 'Quick Actions',
      description: 'Start writing, editing, or browsing works with these convenient shortcuts.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="stats"]',
      title: 'Your Stats',
      description: 'Track your progress, engagement, and growth as a writer.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="recent-works"]',
      title: 'Recent Works',
      description: 'Quickly access your latest creations and continue where you left off.',
      placement: 'top',
    },
    {
      target: '[data-tour="notifications"]',
      title: 'Stay Updated',
      description: 'See recent activity, likes, comments, and follower notifications here.',
      placement: 'top',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation serverUser={user} />
      <WelcomeModal
        userName={user?.profile?.display_name || user?.profile?.username || undefined}
        userEmail={user?.email}
      />
      <OnboardingTour steps={tourSteps} tourKey="dashboard-tour" autoStart={true} />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-2">
              Welcome back, {user?.profile?.display_name || user?.email}! ✨
            </h1>
            <p className="text-muted-foreground">
              Ready to continue your literary journey? Here&apos;s what&apos;s happening in your
              world.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8" data-tour="quick-actions">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center p-4 space-y-2 border-2 hover:border-primary hover:bg-primary/5"
                asChild
              >
                <Link href="/editor">
                  <Plus className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">New Story</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center p-4 space-y-2 border-2 hover:border-primary hover:bg-primary/5"
                asChild
              >
                <Link href="/scripts">
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">New Script</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center p-4 space-y-2 border-2 hover:border-primary hover:bg-primary/5"
                asChild
              >
                <Link href="/editor">
                  <Edit3 className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Continue Draft</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center p-4 space-y-2 border-2 hover:border-primary hover:bg-primary/5"
                asChild
              >
                <Link href="/works">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Browse Works</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Stripe Earnings & Subscription */}
          {stripeData && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Billing & Earnings</h2>
              <StripeEarningsCard
                stripeCustomerId={stripeData.stripe_customer_id}
                stripeConnectAccountId={stripeData.stripe_connect_account_id}
                subscriptionStatus={stripeData.subscription_status}
                subscriptionTier={stripeData.subscription_tier}
                subscriptionCurrentPeriodEnd={stripeData.subscription_current_period_end}
                stripeConnectOnboarded={stripeData.stripe_connect_onboarded ?? false}
                stripeConnectChargesEnabled={stripeData.stripe_connect_charges_enabled ?? false}
                stripeConnectPayoutsEnabled={stripeData.stripe_connect_payouts_enabled ?? false}
              />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4" data-tour="stats">
                <Card className="card-bg border-literary-border">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <BookOpen className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stats.totalWorks}</div>
                    <p className="text-xs text-muted-foreground">Works</p>
                  </CardContent>
                </Card>
                <Card className="card-bg border-literary-border">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {stats.totalFollowers.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </CardContent>
                </Card>
                <Card className="card-bg border-literary-border">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Heart className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {stats.totalLikes > 1000
                        ? (stats.totalLikes / 1000).toFixed(1) + 'K'
                        : stats.totalLikes}
                    </div>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </CardContent>
                </Card>
                <Card className="card-bg border-literary-border">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Eye className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {stats.totalViews > 1000
                        ? (stats.totalViews / 1000).toFixed(0) + 'K'
                        : stats.totalViews}
                    </div>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Works Carousel */}
              <Card className="card-bg card-shadow border-literary-border" data-tour="recent-works">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span>Your Recent Works</span>
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/scripts">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.totalWorks > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Mock data - would be replaced with actual recent works */}
                      {[1, 2, 3].slice(0, stats.totalWorks).map(i => (
                        <Link
                          key={i}
                          href="/editor"
                          className="group block p-4 border border-literary-border rounded-lg hover:shadow-md hover:border-primary transition-all"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                              <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                Draft {i}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                Last edited 2 days ago
                              </p>
                              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>In Progress</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        You haven&apos;t created any works yet
                      </p>
                      <Button asChild>
                        <Link href="/editor">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Work
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Writing Progress */}
              <Card className="card-bg card-shadow border-literary-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Writing Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {weeklyGoal && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Weekly Goal</span>
                        <span className="text-sm text-muted-foreground">
                          {weeklyGoal.current_value} / {weeklyGoal.target_value} {weeklyGoal.unit}
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {weeklyGoal.target_value - weeklyGoal.current_value} {weeklyGoal.unit} to go
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-literary-border">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{stats.currentStreak}</div>
                      <p className="text-xs text-muted-foreground">Day Streak</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {stats.wordsThisMonth.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">Words This Month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="card-bg card-shadow border-literary-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map(post => (
                        <PostCard
                          key={post.id}
                          author={
                            post.user?.display_name || post.user?.username || 'Unknown Author'
                          }
                          avatar={post.user?.avatar_url}
                          time={new Date(post.created_at).toLocaleDateString()}
                          content={post.content}
                          type="discussion"
                          likes={post.likes_count || 0}
                          comments={post.comments_count || 0}
                        />
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No recent activity found.</p>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href="/feed">View All Activity</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Notifications Center */}
              <Card
                className="card-bg card-shadow border-literary-border"
                data-tour="notifications"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <Bell className="h-5 w-5" />
                      <span>Notifications</span>
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/notifications">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Mock notifications - would be replaced with actual data */}
                    {stats.totalLikes > 0 || stats.totalViews > 0 ? (
                      <>
                        {stats.totalLikes > 0 && (
                          <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                              <Heart className="h-4 w-4 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">
                                <span className="font-medium">Your work</span> received new likes
                              </p>
                              <p className="text-xs text-muted-foreground">2 hours ago</p>
                            </div>
                          </div>
                        )}
                        {stats.totalFollowers > 0 && (
                          <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                              <Users className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">
                                <span className="font-medium">New followers</span> added to your
                                network
                              </p>
                              <p className="text-xs text-muted-foreground">5 hours ago</p>
                            </div>
                          </div>
                        )}
                        {stats.postsThisMonth > 0 && (
                          <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                              <MessageCircle className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">
                                <span className="font-medium">New comments</span> on your recent
                                post
                              </p>
                              <p className="text-xs text-muted-foreground">1 day ago</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No new notifications</p>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                    <Link href="/notifications">View All Notifications</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Writing Goals */}
              <Card className="card-bg card-shadow border-literary-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Award className="h-5 w-5" />
                    <span>Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {writingGoals.length > 0 ? (
                    writingGoals.map((goal, index) => (
                      <div key={goal.id || index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {goal.goal_type === 'weekly_words'
                              ? 'Weekly Writing'
                              : goal.goal_type === 'monthly_posts'
                                ? 'Monthly Posts'
                                : goal.goal_type
                                    .replace('_', ' ')
                                    .replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {goal.current_value}/{goal.target_value} {goal.unit}
                          </span>
                        </div>
                        <Progress
                          value={(goal.current_value / goal.target_value) * 100}
                          className="h-1.5"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No goals set yet.</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    {writingGoals.length > 0 ? 'Update Goals' : 'Set Goals'}
                  </Button>
                </CardContent>
              </Card>

              {/* Suggested Authors */}
              <Card className="card-bg card-shadow border-literary-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Users className="h-5 w-5" />
                    <span>Discover Authors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {suggestedAuthors.length > 0 ? (
                      suggestedAuthors.map(author => (
                        <AuthorCard
                          key={author.id}
                          name={author.display_name || author.username}
                          specialty={author.specialty || 'Writer'}
                          location={author.location || 'Location not specified'}
                          works={author.works || 0}
                          followers={author.followers || 0}
                          bio={author.bio || 'No bio available.'}
                          avatar={author.avatar_url}
                          tags={author.specialty ? [author.specialty] : ['Writer']}
                        />
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No suggested authors found.</p>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href="/authors">Explore More Authors</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="card-bg card-shadow border-literary-border">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" asChild>
                    <Link href="/posts/create">
                      <PenTool className="h-4 w-4 mr-2" />
                      Start Writing
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/works">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse Works
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/authors">
                      <Users className="h-4 w-4 mr-2" />
                      Find Authors
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/feed">
                      <Calendar className="h-4 w-4 mr-2" />
                      Community Feed
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
