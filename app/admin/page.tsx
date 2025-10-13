import { requireAdmin } from '@/lib/server/admin-auth'
import AdminDashboardView from './AdminDashboardView'

export const metadata = {
  title: 'Admin Dashboard - Ottopen',
  description: 'Manage content reports and moderation',
}

// Force dynamic rendering - this page requires authentication and cannot be statically generated
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // Server-side admin authorization check
  const adminUser = await requireAdmin()

  return <AdminDashboardView user={adminUser} />
}
