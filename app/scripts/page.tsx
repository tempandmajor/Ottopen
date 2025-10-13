import { requireAuth } from '@/lib/server/auth'
import { ScriptsView } from './ScriptsView'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default async function ScriptsPage() {
  const user = await requireAuth()

  return <ScriptsView />
}
