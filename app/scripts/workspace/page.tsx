import { requireAuth } from '@/lib/server/auth'
import { ScriptsWorkspaceView } from './ScriptsWorkspaceView'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default async function ScriptsWorkspacePage() {
  const user = await requireAuth()

  return <ScriptsWorkspaceView />
}
