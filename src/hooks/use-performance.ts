'use client'

import { useCallback, useEffect, useRef } from 'react'
import { monitoring } from '@/src/lib/monitoring'

export function usePerformance() {
  const performanceRef = useRef<{ [key: string]: number }>({})

  const startMeasurement = useCallback((name: string) => {
    performanceRef.current[name] = performance.now()
  }, [])

  const endMeasurement = useCallback((name: string) => {
    const start = performanceRef.current[name]
    if (start) {
      const duration = performance.now() - start
      monitoring.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
      })
      delete performanceRef.current[name]
      return duration
    }
    return 0
  }, [])

  const measureAsync = useCallback(async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return monitoring.measurePerformance(name, fn)
  }, [])

  const measureSync = useCallback(<T>(name: string, fn: () => T): T => {
    return monitoring.measurePerformance(name, fn)
  }, [])

  return {
    startMeasurement,
    endMeasurement,
    measureAsync,
    measureSync,
  }
}

export function usePagePerformance(pageName: string) {
  useEffect(() => {
    // Track page load performance
    monitoring.trackPageView(pageName)

    // Measure initial render time
    const startTime = performance.now()

    const measureRenderTime = () => {
      const renderTime = performance.now() - startTime
      monitoring.recordMetric({
        name: `page_render_${pageName}`,
        value: renderTime,
        unit: 'ms',
        timestamp: Date.now(),
      })
    }

    // Measure after next tick
    setTimeout(measureRenderTime, 0)

    return () => {
      // Cleanup if needed
    }
  }, [pageName])
}

export function useComponentPerformance(componentName: string) {
  const mountTime = useRef<number>(performance.now())

  useEffect(() => {
    const start = mountTime.current

    return () => {
      const mountDuration = performance.now() - start
      monitoring.recordMetric({
        name: `component_mount_${componentName}`,
        value: mountDuration,
        unit: 'ms',
        timestamp: Date.now(),
      })
    }
  }, [componentName])

  const trackInteraction = useCallback((action: string, metadata?: Record<string, any>) => {
    monitoring.trackUserAction(`${componentName}_${action}`, metadata)
  }, [componentName])

  return { trackInteraction }
}

export function useIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementRef = useRef<Element | null>(null)

  const setElement = useCallback((element: Element | null) => {
    if (elementRef.current && observerRef.current) {
      observerRef.current.unobserve(elementRef.current)
    }

    elementRef.current = element

    if (element) {
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach(callback)
          },
          options
        )
      }
      observerRef.current.observe(element)
    }
  }, [callback, options])

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return setElement
}