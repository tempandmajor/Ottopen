'use client'

import { Sidebar } from '@/src/components/sidebar'
import { Navigation } from '@/src/components/navigation'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="relative min-h-screen">
      <Sidebar />
      <div className="lg:ml-64">
        <Navigation />
        <main className="min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  )
}
