import { requireAuth } from '@/lib/server/auth'
import { getServerUserManuscripts, getServerUserSubmissions } from '@/lib/server/data'
import { EnhancedSubmissionsView } from './EnhancedSubmissionsView'

export default async function SubmissionsPage() {
  const user = await requireAuth()
  const userId = user.profile?.id || user.id

  const [manuscripts, submissions] = await Promise.all([
    getServerUserManuscripts(userId),
    getServerUserSubmissions(userId),
  ])

  return <EnhancedSubmissionsView user={user} manuscripts={manuscripts} submissions={submissions} />
}
