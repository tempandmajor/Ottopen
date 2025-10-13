import { requireAuth } from '@/lib/server/auth'
import { WorksView } from './WorksView'
import { dbService } from '@/src/lib/database'

// Revalidate listing every 2 minutes for freshness/perf balance
export const revalidate = 120

export default async function WorksPage() {
  const user = await requireAuth()

  const posts = await dbService.getPosts({ limit: 20, published: true })
  const worksStats = {
    total: posts.length,
    newThisWeek: posts.filter(
      p => new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
    totalReads: posts.reduce((sum, p) => sum + (p.views_count || 0), 0),
    totalLikes: posts.reduce((sum, p) => sum + (p.likes_count || 0), 0),
  }

  return <WorksView initialPosts={posts} initialStats={worksStats} />
}
