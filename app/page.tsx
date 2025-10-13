import { getServerPosts, getServerUsers, getServerApplicationStatistics } from '@/lib/server/data'
import { HomeView } from './HomeView'

export const revalidate = 300

export default async function HomePage() {
  const [stats, posts] = await Promise.all([
    getServerApplicationStatistics(),
    getServerPosts({ limit: 6, published: true }),
  ])

  // Remove public user listing for privacy
  // Users must opt-in via show_in_directory setting
  const authors: any[] = []

  return <HomeView initialStats={stats} initialPosts={posts} initialAuthors={authors} />
}
