import { requireAuth } from '@/lib/server/auth'
import { getServerJobs, getServerSavedJobs, getServerUserJobApplications } from '@/lib/server/data'
import { OpportunitiesView } from './OpportunitiesView'

export default async function OpportunitiesPage() {
  const user = await requireAuth()

  // Fetch initial data server-side
  const [jobs, savedJobs, userApplications] = await Promise.all([
    getServerJobs({ limit: 50 }),
    getServerSavedJobs(user.profile?.id || user.id),
    getServerUserJobApplications(user.profile?.id || user.id),
  ])

  return (
    <OpportunitiesView
      user={user}
      initialJobs={jobs}
      initialSavedJobs={savedJobs}
      initialApplications={userApplications}
    />
  )
}
