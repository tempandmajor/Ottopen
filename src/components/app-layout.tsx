'use client'

import { Sidebar } from '@/src/components/sidebar'
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

  // Only show global sidebar in 'app' context (not in editors)
  // Keep sidebar visible during loading to prevent flickering
  const showGlobalSidebar = navigationContext === 'app' && (user || loading || !hasHydrated)

  // Show editor sidebar in editor contexts
  const showEditorSidebar =
    user && (navigationContext === 'ai-editor' || navigationContext === 'script-editor')

  // Always reserve space for sidebar if we're in app context and have hydrated
  // This prevents content jumping when auth loads
  const shouldReserveSpace = hasHydrated && (navigationContext === 'app' || showEditorSidebar)

  return (
    <div className="relative min-h-screen">
      {/* Global sidebar for app context */}
      {showGlobalSidebar && <Sidebar />}

      {/* Editor-specific sidebar (passed as prop) */}
      {showEditorSidebar && editorSidebar}

      <div className={shouldReserveSpace ? 'lg:ml-64' : ''}>{children}</div>
    </div>
  )
}
