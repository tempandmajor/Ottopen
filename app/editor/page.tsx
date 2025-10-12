import { requireAuth } from '@/lib/server/auth'
import { ManuscriptsBrowser } from '@/src/components/files-browser/manuscripts-browser'
import { redirect } from 'next/navigation'
import { EditorErrorBoundary } from '@/src/components/EditorErrorBoundary'

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

  return (
    <EditorErrorBoundary>
      <ManuscriptsBrowser />
    </EditorErrorBoundary>
  )
}
