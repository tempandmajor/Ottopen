import { requireAuth } from '@/lib/server/auth'
import MessagesClient from './MessagesClient'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const user = await requireAuth()

  return <MessagesClient user={user} />
}
