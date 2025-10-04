import { requireAuth } from '@/lib/server/auth'
import { EditorWorkspace } from './EditorWorkspace'
import { notFound } from 'next/navigation'
import { ManuscriptService } from '@/src/lib/ai-editor-service'
import { EditorErrorBoundary } from '@/src/components/EditorErrorBoundary'

interface EditorPageProps {
  params: {
    manuscriptId: string
  }
}

export default async function EditorManuscriptPage({ params }: EditorPageProps) {
  const user = await requireAuth()

  // Load manuscript with all details
  const manuscript = await ManuscriptService.getById(params.manuscriptId)

  if (!manuscript) {
    notFound()
  }

  // Verify user owns this manuscript
  if (manuscript.user_id !== user.id) {
    notFound()
  }

  return (
    <EditorErrorBoundary>
      <EditorWorkspace user={user} manuscriptId={params.manuscriptId} />
    </EditorErrorBoundary>
  )
}
