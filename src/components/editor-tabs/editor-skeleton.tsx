'use client'

import { Skeleton } from '@/src/components/ui/skeleton'

export function EditorSkeleton() {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Navigator skeleton */}
      <div className="w-64 border-r bg-background p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2 mt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Editor content skeleton */}
      <div className="flex-1 p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-2/3 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <div className="space-y-3 mt-12">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  )
}
