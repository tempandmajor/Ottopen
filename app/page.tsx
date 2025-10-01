import { getServerPosts, getServerUsers, getServerApplicationStatistics } from '@/lib/server/data'
import { HomeView } from './HomeView'

export default async function HomePage() {
  const [stats, posts, authors] = await Promise.all([
    getServerApplicationStatistics(),
    getServerPosts({ limit: 6, published: true }),
    getServerUsers('', 6),
  ])

  return <HomeView initialStats={stats} initialPosts={posts} initialAuthors={authors} />
}
