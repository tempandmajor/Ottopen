import * as Sentry from '@sentry/nextjs'
import { logError, logInfo } from './logger'

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  timestamp: number
  metadata?: Record<string, any>
}

export interface ErrorContext {
  userId?: string
  action?: string
  component?: string
  url?: string
  userAgent?: string
  metadata?: Record<string, any>
}

class MonitoringService {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 100

  // Performance monitoring
  measurePerformance<T>(name: string, fn: () => T): T
  measurePerformance<T>(name: string, fn: () => Promise<T>): Promise<T>
  measurePerformance<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
    const startTime = performance.now()

    const measure = (result: T) => {
      const endTime = performance.now()
      const duration = endTime - startTime

      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
      })

      logInfo(`Performance: ${name} took ${duration.toFixed(2)}ms`)
      return result
    }

    try {
      const result = fn()

      if (result instanceof Promise) {
        return result.then(measure).catch((error) => {
          this.captureError(error, { action: name })
          throw error
        })
      }

      return measure(result)
    } catch (error) {
      this.captureError(error, { action: name })
      throw error
    }
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)

    // Keep only the latest metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Send to Sentry as custom measurement
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      Sentry.setMeasurement(metric.name, metric.value, metric.unit)
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  clearMetrics() {
    this.metrics = []
  }

  // Error monitoring
  captureError(error: Error, context?: ErrorContext) {
    logError('Error captured', error, context)

    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        if (context?.userId) {
          scope.setUser({ id: context.userId })
        }

        if (context?.component) {
          scope.setTag('component', context.component)
        }

        if (context?.action) {
          scope.setTag('action', context.action)
        }

        if (context?.url) {
          scope.setContext('url', { url: context.url })
        }

        if (context?.userAgent) {
          scope.setContext('userAgent', { userAgent: context.userAgent })
        }

        if (context?.metadata) {
          scope.setContext('metadata', context.metadata)
        }

        Sentry.captureException(error)
      })
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    logInfo(message, context)

    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        if (context?.userId) {
          scope.setUser({ id: context.userId })
        }

        if (context?.metadata) {
          scope.setContext('metadata', context.metadata)
        }

        Sentry.captureMessage(message, level)
      })
    }
  }

  // Web Vitals monitoring
  measureWebVitals() {
    if (typeof window === 'undefined') return

    // Measure Core Web Vitals
    this.measureCLS()
    this.measureFID()
    this.measureLCP()
    this.measureFCP()
    this.measureTTFB()
  }

  private measureCLS() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          this.recordMetric({
            name: 'CLS',
            value: (entry as any).value,
            unit: 'count',
            timestamp: Date.now(),
          })
        }
      }
    }).observe({ type: 'layout-shift', buffered: true })
  }

  private measureFID() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric({
          name: 'FID',
          value: (entry as any).processingStart - entry.startTime,
          unit: 'ms',
          timestamp: Date.now(),
        })
      }
    }).observe({ type: 'first-input', buffered: true })
  }

  private measureLCP() {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.recordMetric({
        name: 'LCP',
        value: lastEntry.startTime,
        unit: 'ms',
        timestamp: Date.now(),
      })
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  }

  private measureFCP() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric({
            name: 'FCP',
            value: entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
          })
        }
      }
    }).observe({ type: 'paint', buffered: true })
  }

  private measureTTFB() {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      this.recordMetric({
        name: 'TTFB',
        value: navigationEntry.responseStart - navigationEntry.requestStart,
        unit: 'ms',
        timestamp: Date.now(),
      })
    }
  }

  // User experience monitoring
  trackUserAction(action: string, metadata?: Record<string, any>) {
    this.recordMetric({
      name: `user_action_${action}`,
      value: 1,
      unit: 'count',
      timestamp: Date.now(),
      metadata,
    })

    logInfo(`User action: ${action}`, metadata)
  }

  trackPageView(url: string, metadata?: Record<string, any>) {
    this.recordMetric({
      name: 'page_view',
      value: 1,
      unit: 'count',
      timestamp: Date.now(),
      metadata: { url, ...metadata },
    })

    logInfo(`Page view: ${url}`, metadata)
  }

  // Database query monitoring
  trackDatabaseQuery(operation: string, table: string, duration: number, success: boolean) {
    this.recordMetric({
      name: `db_query_${operation}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: { table, success },
    })

    if (!success) {
      this.captureMessage(`Database query failed: ${operation} on ${table}`, 'warning', {
        metadata: { table, duration },
      })
    }
  }

  // API monitoring
  trackAPICall(endpoint: string, method: string, duration: number, statusCode: number) {
    this.recordMetric({
      name: `api_call`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: { endpoint, method, statusCode },
    })

    if (statusCode >= 400) {
      this.captureMessage(`API call failed: ${method} ${endpoint}`, 'warning', {
        metadata: { endpoint, method, statusCode, duration },
      })
    }
  }
}

export const monitoring = new MonitoringService()

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  return {
    measurePerformance: monitoring.measurePerformance.bind(monitoring),
    recordMetric: monitoring.recordMetric.bind(monitoring),
    captureError: monitoring.captureError.bind(monitoring),
    trackUserAction: monitoring.trackUserAction.bind(monitoring),
    trackPageView: monitoring.trackPageView.bind(monitoring),
  }
}

// Initialize web vitals monitoring on client side
if (typeof window !== 'undefined') {
  monitoring.measureWebVitals()
}