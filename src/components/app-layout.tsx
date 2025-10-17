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

  // Show global sidebar in 'app' context once we've hydrated and either
  // have an authenticated user or are still resolving auth state.
  const showGlobalSidebar = navigationContext === 'app' && hasHydrated && (loading || Boolean(user))

  // Determine which sidebar variant to render
  const renderAuthenticatedSidebar = showGlobalSidebar && !loading && !!user
  const renderSidebarSkeleton = showGlobalSidebar && loading && !user

  // Show editor sidebar in editor contexts when user is authenticated
  const showEditorSidebar =
    hasHydrated &&
    user &&
    !loading &&
    (navigationContext === 'ai-editor' || navigationContext === 'script-editor')

  // Reserve sidebar space when any sidebar (or skeleton) is shown
  // This prevents layout shift and maintains consistent spacing
  const shouldReserveSpace = showGlobalSidebar || showEditorSidebar

  return (
    <div className="relative min-h-screen">
      {/* Global header - gets user from auth context */}
      <Navigation />

      {/* Global sidebar for app context – either full sidebar or skeleton while loading */}
      {renderAuthenticatedSidebar && <Sidebar />}
      {renderSidebarSkeleton && (
        <aside
          className="hidden lg:block lg:fixed lg:left-0 lg:top-16 lg:z-40 lg:h-[calc(100vh-4rem)] lg:w-64 lg:border-r lg:bg-muted/40 animate-pulse"
          data-testid="sidebar-skeleton"
          aria-hidden="true"
        />
      )}

      {/* Editor-specific sidebar (passed as prop) */}
      {showEditorSidebar && editorSidebar}

      {/* Content area with consistent spacing - sidebar space reserved when sidebar shown */}
      <div className={shouldReserveSpace ? 'lg:ml-64' : ''} data-testid="app-layout-content">
        {children}
      </div>
    </div>
  )
}
