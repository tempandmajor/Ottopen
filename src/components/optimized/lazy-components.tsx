'use client'

import { lazy, Suspense, ReactNode } from 'react'
import { useIntersectionObserver } from '@/src/hooks/use-performance'

// Lazy load components with proper loading states
export const LazyPostCard = lazy(() =>
  import('@/src/components/post-card').then(module => ({ default: module.PostCard }))
)

export const LazyAuthorCard = lazy(() =>
  import('@/src/components/author-card').then(module => ({ default: module.AuthorCard }))
)

// Generic lazy loading wrapper
interface LazyLoadProps {
  children: ReactNode
  fallback?: ReactNode
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function LazyLoad({
  children,
  fallback = <div className="h-24 animate-pulse bg-muted rounded" />,
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)

  const setElement = useIntersectionObserver(
    (entry) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        if (triggerOnce) {
          setHasTriggered(true)
        }
      } else if (!triggerOnce) {
        setIsVisible(false)
      }
    },
    {
      threshold,
      rootMargin,
    }
  )

  if (hasTriggered && triggerOnce) {
    return <>{children}</>
  }

  return (
    <div ref={setElement}>
      {isVisible ? children : fallback}
    </div>
  )
}

// Lazy loading container for lists
interface LazyListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  batchSize?: number
  loadMoreThreshold?: number
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
  LoadingComponent?: ReactNode
  EmptyComponent?: ReactNode
}

export function LazyList<T>({
  items,
  renderItem,
  batchSize = 10,
  loadMoreThreshold = 3,
  onLoadMore,
  hasMore = false,
  loading = false,
  LoadingComponent = <div className="h-24 animate-pulse bg-muted rounded" />,
  EmptyComponent = <div className="text-center text-muted-foreground">No items found</div>,
}: LazyListProps<T>) {
  const [visibleCount, setVisibleCount] = useState(batchSize)

  const handleLoadMore = useCallback(() => {
    if (hasMore && onLoadMore && !loading) {
      onLoadMore()
    } else {
      setVisibleCount(prev => Math.min(prev + batchSize, items.length))
    }
  }, [hasMore, onLoadMore, loading, batchSize, items.length])

  const setTriggerElement = useIntersectionObserver(
    (entry) => {
      if (entry.isIntersecting) {
        handleLoadMore()
      }
    },
    {
      threshold: 0.1,
      rootMargin: '100px',
    }
  )

  if (items.length === 0 && !loading) {
    return <>{EmptyComponent}</>
  }

  const visibleItems = items.slice(0, visibleCount)
  const shouldShowTrigger = visibleCount < items.length || (hasMore && !loading)

  return (
    <div className="space-y-4">
      {visibleItems.map((item, index) => (
        <LazyLoad key={index} triggerOnce>
          {renderItem(item, index)}
        </LazyLoad>
      ))}

      {loading && LoadingComponent}

      {shouldShowTrigger && (
        <div
          ref={setTriggerElement}
          className="h-4 w-full"
          style={{
            marginTop: `${loadMoreThreshold * 100}px`
          }}
        />
      )}
    </div>
  )
}

// Suspense wrapper with better loading states
interface SuspenseWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  errorBoundary?: boolean
}

export function SuspenseWrapper({
  children,
  fallback = <ComponentSkeleton />,
  errorBoundary = true,
}: SuspenseWrapperProps) {
  const content = <Suspense fallback={fallback}>{children}</Suspense>

  if (errorBoundary) {
    return <ErrorBoundary>{content}</ErrorBoundary>
  }

  return content
}

// Loading skeletons
export function ComponentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="h-32 bg-muted rounded" />
    </div>
  )
}

export function PostSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-4 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 bg-muted rounded-full" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-32" />
          <div className="h-3 bg-muted rounded w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
      <div className="flex space-x-4">
        <div className="h-8 bg-muted rounded w-16" />
        <div className="h-8 bg-muted rounded w-16" />
      </div>
    </div>
  )
}

// Error boundary component

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo)

    // Log to monitoring service
    if (typeof window !== 'undefined') {
      import('@/src/lib/monitoring').then(({ monitoring }) => {
        monitoring.captureError(error, {
          component: 'ErrorBoundary',
          metadata: { errorInfo },
        })
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 border border-destructive rounded-lg">
            <h3 className="font-semibold text-destructive">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mt-1">
              An error occurred while loading this component.
            </p>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// React imports
import { useState, useCallback, Component, ErrorInfo } from 'react'