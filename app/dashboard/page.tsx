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
import type { Post, User } from '@/src/lib/supabase'
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
  })
  const [recentActivity, setRecentActivity] = useState<Post[]>([])
  const [suggestedAuthors, setSuggestedAuthors] = useState<User[]>([])

  // Mock writing goals - these would ideally be stored in the database
  const writingGoals = [
    {
      title: 'Weekly Writing Goal',
      current: 3420,
      target: 5000,
      unit: 'words',
    },
    {
      title: 'Monthly Posts',
      current: stats.postsThisMonth,
      target: 30,
      unit: 'posts',
    },
    {
      title: 'Reading Goal',
      current: 18,
      target: 24,
      unit: 'books',
    },
  ]

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.profile?.id) return

      try {
        setLoading(true)

        // Get user's posts for statistics
        const userPosts = await dbService.getPosts({
          userId: user.profile.id,
          limit: 100,
        })

        // Get user's follower count
        const followers = await dbService.getFollowers(user.profile.id)

        // Calculate statistics
        const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0)
        const totalViews = userPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0) // Using likes as proxy for views
        const thisMonth = new Date()
        thisMonth.setMonth(thisMonth.getMonth() - 1)
        const postsThisMonth = userPosts.filter(
          post => new Date(post.created_at) > thisMonth
        ).length

        setStats({
          totalWorks: userPosts.length,
          totalFollowers: followers.length,
          totalLikes,
          totalViews,
          wordsThisMonth: Math.floor(Math.random() * 15000) + 5000, // Mock data for words
          postsThisMonth,
        })

        // Get recent activity from followed users
        const recentPosts = await dbService.getPosts({
          limit: 5,
          published: true,
        })
        setRecentActivity(recentPosts)

        // Get suggested authors (users with most followers)
        const authors = await dbService.searchUsers('', 4)
        setSuggestedAuthors(authors.filter(author => author.id !== user.profile?.id))
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  const progressPercentage = (writingGoals[0].current / writingGoals[0].target) * 100

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
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Weekly Goal</span>
                      <span className="text-sm text-muted-foreground">
                        {writingGoals[0].current} / {writingGoals[0].target} words
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {writingGoals[0].target - writingGoals[0].current} words to go
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-literary-border">
                    <div className="text-center">
                      <div className="text-lg font-semibold">45</div>
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
                  {writingGoals.map((goal, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{goal.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {goal.current}/{goal.target} {goal.unit}
                        </span>
                      </div>
                      <Progress value={(goal.current / goal.target) * 100} className="h-1.5" />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Update Goals
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
                          location="Unknown"
                          works={0}
                          followers={0}
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
