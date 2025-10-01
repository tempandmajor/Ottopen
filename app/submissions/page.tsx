import { requireAuth } from '@/lib/server/auth'
import { getServerUserManuscripts, getServerUserSubmissions } from '@/lib/server/data'
import { SubmissionsView } from './SubmissionsView'

export default async function SubmissionsPage() {
  const user = await requireAuth()
  const userId = user.profile?.id || user.id

  const [manuscripts, submissions] = await Promise.all([
    getServerUserManuscripts(userId),
    getServerUserSubmissions(userId),
  ])

  return <SubmissionsView user={user} manuscripts={manuscripts} submissions={submissions} />
}
