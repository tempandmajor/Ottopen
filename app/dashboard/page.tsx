import { requireAuth } from '@/lib/server/auth'
import {
  getServerPosts,
  getServerUserStatistics,
  getServerWritingGoals,
  getServerWritingSessions,
  getServerWritingStreak,
  getServerFollowers,
  getServerUsers,
} from '@/lib/server/data'
import { DashboardView } from './DashboardView'

export default async function DashboardPage() {
  const user = await requireAuth()
  const userId = user.profile?.id || user.id

  // Fetch all dashboard data in parallel on the server
  const [
    userStatistics,
    userPosts,
    followers,
    writingStreak,
    writingSessions,
    writingGoals,
    recentPosts,
    suggestedAuthors,
  ] = await Promise.all([
    getServerUserStatistics(userId),
    getServerPosts({ userId, limit: 100, published: undefined }),
    getServerFollowers(userId),
    getServerWritingStreak(userId),
    getServerWritingSessions(userId, 30),
    getServerWritingGoals(userId),
    getServerPosts({ limit: 5, published: true }),
    getServerUsers('', 4),
  ])

  // Calculate aggregated stats
  const publishedPosts = userPosts.filter(p => p.published)
  const stats = {
    totalWorks: publishedPosts.length,
    totalFollowers: followers.length,
    totalLikes: userStatistics?.likes_received_count || 0,
    totalViews: userPosts.reduce((sum, post) => sum + (post.views_count || 0), 0),
    wordsThisMonth: userStatistics?.total_words_written || 0,
    postsThisMonth: publishedPosts.filter(p => {
      const postDate = new Date(p.created_at)
      const now = new Date()
      return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear()
    }).length,
    currentStreak: writingStreak,
  }

  return (
    <DashboardView
      user={user}
      stats={stats}
      recentActivity={userPosts.slice(0, 10)}
      suggestedAuthors={suggestedAuthors}
      writingGoals={writingGoals}
      userStatistics={userStatistics}
    />
  )
}
