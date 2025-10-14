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

  // Show global sidebar in 'app' context when signed in or while loading to prevent flicker on refresh
  const showGlobalSidebar = navigationContext === 'app' && (user || loading)

  // Show editor sidebar in editor contexts
  const showEditorSidebar =
    user && (navigationContext === 'ai-editor' || navigationContext === 'script-editor')

  // Reserve space only when a sidebar is actually rendered to avoid left gutter when signed out
  const shouldReserveSpace = hasHydrated && (showGlobalSidebar || showEditorSidebar)

  return (
    <div className="relative min-h-screen">
      {/* Global header - gets user from auth context */}
      <Navigation />

      {/* Global sidebar for app context */}
      {showGlobalSidebar && <Sidebar />}

      {/* Editor-specific sidebar (passed as prop) */}
      {showEditorSidebar && editorSidebar}

      {/* Content area is the only region inset to accommodate sidebar */}
      <div className={shouldReserveSpace ? 'lg:ml-64' : ''}>{children}</div>
    </div>
  )
}
