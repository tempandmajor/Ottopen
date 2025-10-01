import { requireAuth } from '@/lib/server/auth'
import { EditorDashboard } from './EditorDashboard'
import { redirect } from 'next/navigation'

export default async function EditorPage() {
  const user = await requireAuth()

  // Check if user has access to AI Editor (account type check)
  const profile = user.profile
  if (!profile) {
    redirect('/dashboard')
  }

  // Only writers can access AI Editor
  if (profile.account_type !== 'writer') {
    redirect('/dashboard?error=ai-editor-writers-only')
  }

  return <EditorDashboard user={user} />
}
