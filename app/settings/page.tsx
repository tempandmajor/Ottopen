import { requireAuth } from '@/lib/server/auth'
import { SettingsView } from './SettingsView'

export default async function SettingsPage() {
  const user = await requireAuth()
  return <SettingsView user={user} />
}
