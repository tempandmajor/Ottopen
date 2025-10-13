'use client'
import { Navigation } from '@/src/components/navigation'
import { Suspense } from 'react'
import EnhancedSearchView from './EnhancedSearchView'
import { Search } from 'lucide-react'
import type { User } from '@/src/lib/supabase'

function SearchContent() {
  return <EnhancedSearchView />
}

interface SearchPageViewProps {
  user: (User & { profile?: any }) | null
}

export default function SearchPageView({ user }: SearchPageViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
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
  )
}
