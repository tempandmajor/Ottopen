'use client'

import { Sidebar } from '@/src/components/sidebar'
import { Navigation } from '@/src/components/navigation'
import { useAuth } from '@/src/contexts/auth-context'
import { useNavigationContext } from '@/src/hooks/useNavigationContext'
import { useEffect, useState } from 'react'

interface AppLayoutProps {
  children: React.ReactNode
  editorSidebar?: React.ReactNode
}

export function AppLayout({ children, editorSidebar }: AppLayoutProps) {
  const { user, loading } = useAuth()
  const navigationContext = useNavigationContext()
  const [hasHydrated, setHasHydrated] = useState(false)

  // Track hydration to prevent layout shift
  useEffect(() => {
    setHasHydrated(true)
  }, [])

  // Show global sidebar in 'app' context when signed in
  // Keep showing during loading to prevent flicker, but only if we've hydrated
  const showGlobalSidebar = navigationContext === 'app' && hasHydrated && (user || loading)

  // Show editor sidebar in editor contexts when user is authenticated
  const showEditorSidebar =
    hasHydrated &&
    user &&
    !loading &&
    (navigationContext === 'ai-editor' || navigationContext === 'script-editor')

  // Reserve sidebar space when sidebar is shown
  // This prevents layout shift and maintains consistent spacing
  const shouldReserveSpace = showGlobalSidebar || showEditorSidebar

  return (
    <div className="relative min-h-screen">
      {/* Global header - gets user from auth context */}
      <Navigation />

      {/* Global sidebar for app context - shown when user is authenticated or loading */}
      {showGlobalSidebar && <Sidebar />}

      {/* Editor-specific sidebar (passed as prop) */}
      {showEditorSidebar && editorSidebar}

      {/* Content area with consistent spacing - sidebar space reserved when sidebar shown */}
      <div className={shouldReserveSpace ? 'lg:ml-64' : ''}>{children}</div>
    </div>
  )
}
