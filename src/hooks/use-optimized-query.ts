'use client'

import {
  useQuery,
  useInfiniteQuery,
  UseQueryOptions,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { monitoring } from '@/src/lib/monitoring'

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  trackPerformance?: boolean
  retryOnError?: boolean
}

export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: OptimizedQueryOptions<T>
) {
  const startTimeRef = useRef<number>()

  const result = useQuery({
    queryKey,
    queryFn: async () => {
      if (options?.trackPerformance) {
        startTimeRef.current = performance.now()
      }

      try {
        const data = await queryFn()

        if (options?.trackPerformance && startTimeRef.current) {
          const duration = performance.now() - startTimeRef.current
          monitoring.recordMetric({
            name: `query_${queryKey.join('_')}`,
            value: duration,
            unit: 'ms',
            timestamp: Date.now(),
          })
        }

        return data
      } catch (error) {
        if (options?.trackPerformance) {
          monitoring.captureError(error as Error, {
            action: 'query',
            metadata: { queryKey },
          })
        }
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: options?.retryOnError ? 3 : false,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  })

  useEffect(() => {
    if (result.error && options?.trackPerformance) {
      monitoring.captureError(result.error as Error, {
        action: 'query_error',
        metadata: { queryKey },
      })
    }
  }, [result.error, queryKey, options?.trackPerformance])

  return result
}

interface OptimizedInfiniteQueryOptions<T>
  extends Omit<UseInfiniteQueryOptions<T>, 'queryKey' | 'queryFn'> {
  trackPerformance?: boolean
}

export function useOptimizedInfiniteQuery<T>(
  queryKey: string[],
  queryFn: ({ pageParam }: { pageParam: unknown }) => Promise<T>,
  options?: OptimizedInfiniteQueryOptions<T>
) {
  const result = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: unknown }) => {
      const startTime = performance.now()

      try {
        const data = await queryFn({ pageParam })

        if (options?.trackPerformance) {
          const duration = performance.now() - startTime
          monitoring.recordMetric({
            name: `infinite_query_${queryKey.join('_')}`,
            value: duration,
            unit: 'ms',
            timestamp: Date.now(),
          })
        }

        return data
      } catch (error) {
        if (options?.trackPerformance) {
          monitoring.captureError(error as Error, {
            action: 'infinite_query',
            metadata: { queryKey, pageParam },
          })
        }
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    getNextPageParam: () => undefined,
    ...options,
  } as any)

  return result
}

// Prefetch utility
export function usePrefetch() {
  const { useQueryClient } = require('@tanstack/react-query')
  const queryClient = useQueryClient()

  const prefetchQuery = (queryKey: string[], queryFn: () => Promise<any>) => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 5 * 60 * 1000,
    })
  }

  return { prefetchQuery }
}

// Cache utilities
export function useQueryCache() {
  const { useQueryClient } = require('@tanstack/react-query')
  const queryClient = useQueryClient()

  const invalidateQueries = (queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey })
  }

  const removeQueries = (queryKey: string[]) => {
    queryClient.removeQueries({ queryKey })
  }

  const setQueryData = <T>(queryKey: string[], data: T) => {
    queryClient.setQueryData(queryKey, data)
  }

  const getQueryData = <T>(queryKey: string[]): T | undefined => {
    return queryClient.getQueryData(queryKey)
  }

  return {
    invalidateQueries,
    removeQueries,
    setQueryData,
    getQueryData,
  }
}
