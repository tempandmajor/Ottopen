'use client'

import { Navigation } from '@/src/components/navigation'
import { ProtectedRoute } from '@/src/components/auth/protected-route'
import { Suspense } from 'react'
import EnhancedSearchView from './EnhancedSearchView'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Search } from 'lucide-react'

function SearchContent() {
  return <EnhancedSearchView />
}

export default function SearchPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <Suspense
          fallback={
            <div className="container mx-auto px-4 py-6">
              <div className="max-w-6xl mx-auto text-center py-12">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
                <h2 className="font-serif text-2xl font-semibold mb-2">Loading Search...</h2>
                <p className="text-muted-foreground">
                  Please wait while we prepare your search experience.
                </p>
              </div>
            </div>
          }
        >
          <SearchContent />
        </Suspense>
      </div>
    </ProtectedRoute>
  )
}
