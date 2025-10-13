import { requireAuth } from '@/lib/server/auth'
import EnhancedFeedView from './EnhancedFeedView'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const user = await requireAuth()

  return <EnhancedFeedView user={user} />
}
