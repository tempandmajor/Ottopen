'use client'

import { Sidebar } from '@/src/components/sidebar'
import { useAuth } from '@/src/contexts/auth-context'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth()

  return (
    <div className="relative min-h-screen">
      {/* Only show sidebar for authenticated users */}
      {user && <Sidebar />}
      <div className={user ? 'lg:ml-64' : ''}>{children}</div>
    </div>
  )
}
