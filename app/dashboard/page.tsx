'use client'

import { Navigation } from '@/src/components/navigation'
import { PostCard } from '@/src/components/post-card'
import { AuthorCard } from '@/src/components/author-card'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Progress } from '@/src/components/ui/progress'
import { ProtectedRoute } from '@/src/components/auth/protected-route'
import {
  BookOpen,
  Users,
  Heart,
  MessageCircle,
  TrendingUp,
  Star,
  PenTool,
  Calendar,
  Target,
  Award,
  Eye,
  Loader2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/src/contexts/auth-context'
import { dbService } from '@/src/lib/database'
import type { Post, User, WritingGoal, UserStatistics } from '@/src/lib/supabase'

// Extended User type for dashboard display with computed stats
type UserWithStats = User & {
  works?: number
  followers?: number
}
import { toast } from 'react-hot-toast'
import Link from 'next/link'

function DashboardContent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalWorks: 0,
    totalFollowers: 0,
    totalLikes: 0,
    totalViews: 0,
    wordsThisMonth: 0,
    postsThisMonth: 0,
    currentStreak: 0,
  })
  const [recentActivity, setRecentActivity] = useState<Post[]>([])
  const [suggestedAuthors, setSuggestedAuthors] = useState<UserWithStats[]>([])
  const [writingGoals, setWritingGoals] = useState<WritingGoal[]>([])
  const [userStatistics, setUserStatistics] = useState<UserStatistics | null>(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.profile?.id) return

      try {
        setLoading(true)

        // Load user statistics
        const userStats = await dbService.getUserStatistics(user.profile.id)
        setUserStatistics(userStats)

        // Update user statistics if needed
        if (!userStats) {
          await dbService.updateUserStatistics(user.profile.id)
        }

        // Get user's posts for recent statistics
        const userPosts = await dbService.getPosts({
          userId: user.profile.id,
          limit: 100,
        })

        // Get user's follower count
        const followers = await dbService.getFollowers(user.profile.id)

        // Get writing streak
        const currentStreak = await dbService.getWritingStreak(user.profile.id)

        // Get writing sessions for this month
        const writingSessions = await dbService.getWritingSessions(user.profile.id, 30)
        const thisMonth = new Date()
        thisMonth.setMonth(thisMonth.getMonth())
        const thisMonthSessions = writingSessions.filter(
          session => new Date(session.session_date).getMonth() === thisMonth.getMonth()
        )
        const wordsThisMonth = thisMonthSessions.reduce(
          (sum, session) => sum + session.words_written,
          0
        )

        // Calculate statistics
        const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0)
        const totalViews = userPosts.reduce((sum, post) => sum + (post.views_count || 0), 0)

        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const postsThisMonth = userPosts.filter(
          post => new Date(post.created_at) > lastMonth
        ).length

        setStats({
          totalWorks: userStats?.published_posts_count || userPosts.filter(p => p.published).length,
          totalFollowers: userStats?.followers_count || followers.length,
          totalLikes: userStats?.likes_received_count || totalLikes,
          totalViews: totalViews,
          wordsThisMonth: wordsThisMonth,
          postsThisMonth,
          currentStreak,
        })

        // Load writing goals
        const goals = await dbService.getWritingGoals(user.profile.id)
        setWritingGoals(goals)

        // If no writing goals exist, create default ones
        if (goals.length === 0) {
          const defaultGoals = [
            {
              user_id: user.profile.id,
              goal_type: 'weekly_words',
              target_value: 5000,
              current_value: 0,
              unit: 'words',
              period: 'weekly',
              is_active: true,
            },
            {
              user_id: user.profile.id,
              goal_type: 'monthly_posts',
              target_value: 8,
              current_value: postsThisMonth,
              unit: 'posts',
              period: 'monthly',
              is_active: true,
            },
          ]

          for (const goal of defaultGoals) {
            await dbService.createWritingGoal(goal)
          }

          // Reload goals after creating defaults
          const newGoals = await dbService.getWritingGoals(user.profile.id)
          setWritingGoals(newGoals)
        }

        // Get recent activity from followed users
        const recentPosts = await dbService.getPosts({
          limit: 5,
          published: true,
        })
        setRecentActivity(recentPosts)

        // Get suggested authors with real stats
        const authors = await dbService.searchUsers('', 4)
        const authorsWithStats = await Promise.all(
          authors
            .filter(author => author.id !== user.profile?.id)
            .slice(0, 3)
            .map(async author => {
              const authorStats = await dbService.getUserStatistics(author.id)
              const followersList = await dbService.getFollowers(author.id)
              return {
                ...author,
                works: authorStats?.published_posts_count || 0,
                followers: authorStats?.followers_count || followersList.length,
              }
            })
        )
        setSuggestedAuthors(authorsWithStats)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  const weeklyGoal = writingGoals.find(g => g.goal_type === 'weekly_words')
  const progressPercentage = weeklyGoal
    ? (weeklyGoal.current_value / weeklyGoal.target_value) * 100
    : 0

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

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

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="card-bg border-literary-border">
                  <CardContent className="p-4 text-center">
                    <BookOpen className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      ) : (
                        stats.totalWorks
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Works</p>
                  </CardContent>
                </Card>
                <Card className="card-bg border-literary-border">
                  <CardContent className="p-4 text-center">
                    <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      ) : (
                        stats.totalFollowers.toLocaleString()
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </CardContent>
                </Card>
                <Card className="card-bg border-literary-border">
                  <CardContent className="p-4 text-center">
                    <Heart className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      ) : stats.totalLikes > 1000 ? (
                        (stats.totalLikes / 1000).toFixed(1) + 'K'
                      ) : (
                        stats.totalLikes
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </CardContent>
                </Card>
                <Card className="card-bg border-literary-border">
                  <CardContent className="p-4 text-center">
                    <Eye className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      ) : stats.totalViews > 1000 ? (
                        (stats.totalViews / 1000).toFixed(0) + 'K'
                      ) : (
                        stats.totalViews
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </CardContent>
                </Card>
              </div>

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
                      <div className="text-lg font-semibold">
                        {loading ? '...' : stats.currentStreak}
                      </div>
                      <p className="text-xs text-muted-foreground">Day Streak</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {loading ? '...' : stats.wordsThisMonth.toLocaleString()}
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
                    {loading ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="mt-2 text-sm text-muted-foreground">Loading activity...</p>
                      </div>
                    ) : recentActivity.length > 0 ? (
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
              {/* Writing Goals */}
              <Card className="card-bg card-shadow border-literary-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Award className="h-5 w-5" />
                    <span>Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-sm text-muted-foreground">Loading goals...</p>
                    </div>
                  ) : writingGoals.length > 0 ? (
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
                    {loading ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="mt-2 text-sm text-muted-foreground">Loading authors...</p>
                      </div>
                    ) : suggestedAuthors.length > 0 ? (
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

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
