import { requireAdmin } from '@/lib/server/admin-auth'
import ModerationDashboardView from './ModerationDashboardView'

export const metadata = {
  title: 'Moderation Dashboard - Ottopen',
  description: 'Manage content reports and moderation actions',
}

// Force dynamic rendering - this page requires authentication and cannot be statically generated
export const dynamic = 'force-dynamic'

export default async function ModerationPage() {
  // Server-side admin authorization check
  const adminUser = await requireAdmin()

  return <ModerationDashboardView user={adminUser} />
}
