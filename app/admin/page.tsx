import { requireAdmin } from '@/lib/server/admin-auth'
import AdminDashboardView from './AdminDashboardView'

export const metadata = {
  title: 'Admin Dashboard - Ottopen',
  description: 'Manage content reports and moderation',
}

export default async function AdminPage() {
  // Server-side admin authorization check
  const adminUser = await requireAdmin()

  return <AdminDashboardView />
}
