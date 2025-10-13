import { requireAuth } from '@/lib/server/auth'
import { AuthorsView } from './AuthorsView'
import { dbService } from '@/src/lib/database'

// Revalidate listing every 2 minutes for freshness/perf balance
export const revalidate = 120

export default async function AuthorsPage() {
  const user = await requireAuth()
  const appStats = await dbService.getApplicationStatistics()
  const authors = await dbService.getOptedInAuthors(20)
  const authorIds = authors.map(a => a.id)
  const statsMap = await dbService.getBulkUserStatistics(authorIds)

  const authorsWithStats = authors.map(author => {
    const userStats = statsMap.get(author.id)
    return {
      ...author,
      works: userStats?.published_posts_count || 0,
      followers: userStats?.followers_count || 0,
    }
  })

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const newThisMonth = authors.filter(author => new Date(author.created_at) > thirtyDaysAgo).length
  const activeWriters = authorsWithStats.filter(a => a.works > 0).length

  const authorStats = {
    total: authors.length,
    newThisMonth,
    publishedWorksTotal: appStats.stories_shared || 0,
    activeWriters,
  }

  return (
    <AuthorsView
      initialAuthors={authors}
      initialAuthorsWithStats={authorsWithStats}
      initialAuthorStats={authorStats}
    />
  )
}
