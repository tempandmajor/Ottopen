import { requireAuth } from '@/lib/server/auth'
import { EditorWorkspaceView } from './EditorWorkspaceView'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default async function EditorWorkspacePage() {
  const user = await requireAuth()

  return <EditorWorkspaceView />
}
