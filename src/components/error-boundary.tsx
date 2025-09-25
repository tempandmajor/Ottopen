'use client'

import React from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { monitoring } from '@/src/lib/monitoring'
import { logError } from '@/src/lib/logger'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  hasRetried?: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError } = this.props

    // Log error
    logError('React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    })

    // Send to monitoring
    monitoring.captureError(error, {
      component: 'ErrorBoundary',
      metadata: {
        componentStack: errorInfo.componentStack,
        retryCount: this.retryCount,
      },
    })

    // Call custom error handler
    onError?.(error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  resetError = () => {
    this.retryCount++
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    const { children, fallback: Fallback } = this.props
    const { hasError, error } = this.state

    if (hasError && error) {
      const hasRetried = this.retryCount > 0

      if (Fallback) {
        return <Fallback error={error} resetError={this.resetError} hasRetried={hasRetried} />
      }

      return (
        <DefaultErrorFallback error={error} resetError={this.resetError} hasRetried={hasRetried} />
      )
    }

    return children
  }
}

function DefaultErrorFallback({ error, resetError, hasRetried }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-lg">Something went wrong</CardTitle>
          <CardDescription>
            {hasRetried
              ? 'The error persists after retrying. Please refresh the page or contact support.'
              : 'An unexpected error occurred. You can try again or refresh the page.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={resetError} variant="outline" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="default" className="flex-1">
              Refresh Page
            </Button>
          </div>

          {isDevelopment && error && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Error Details (Development Only)
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono break-all">
                <div className="font-semibold text-destructive">{error.name}</div>
                <div className="mt-1">{error.message}</div>
                {error.stack && (
                  <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for using error boundaries functionally
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    logError('Manual error reported', error, errorInfo)
    monitoring.captureError(error, {
      component: 'useErrorHandler',
      metadata: errorInfo,
    })
  }
}

// HOC for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Specific error boundaries for different contexts
export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center p-4">
          <DefaultErrorFallback error={error} resetError={resetError} />
        </div>
      )}
      onError={error => {
        monitoring.captureError(error, {
          component: 'RouteErrorBoundary',
          url: window.location.href,
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export function FormErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="p-4 border border-destructive/20 rounded-md bg-destructive/5">
          <div className="flex items-center space-x-2 text-sm text-destructive mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Form Error</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            There was an error with this form. Please try again.
          </p>
          <Button size="sm" variant="outline" onClick={resetError}>
            Try Again
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
