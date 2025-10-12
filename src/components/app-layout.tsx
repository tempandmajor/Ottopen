'use client'

import { Sidebar } from '@/src/components/sidebar'
import { useAuth } from '@/src/contexts/auth-context'
import { useNavigationContext } from '@/src/hooks/useNavigationContext'

interface AppLayoutProps {
  children: React.ReactNode
  editorSidebar?: React.ReactNode
}

export function AppLayout({ children, editorSidebar }: AppLayoutProps) {
  const { user } = useAuth()
  const navigationContext = useNavigationContext()

  // Only show global sidebar in 'app' context (not in editors)
  const showGlobalSidebar = user && navigationContext === 'app'
  // Show editor sidebar in editor contexts
  const showEditorSidebar = user && (navigationContext === 'ai-editor' || navigationContext === 'script-editor')

  return (
    <div className="relative min-h-screen">
      {/* Global sidebar for app context */}
      {showGlobalSidebar && <Sidebar />}

      {/* Editor-specific sidebar (passed as prop) */}
      {showEditorSidebar && editorSidebar}

      <div className={user ? 'lg:ml-64' : ''}>{children}</div>
    </div>
  )
}
