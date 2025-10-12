import { useState, useCallback, useEffect } from 'react'
import { logAuthEvent } from '@/src/lib/auth-monitoring'

interface RateLimitState {
  isBlocked: boolean
  remainingTime: number
  attemptCount: number
}

interface UseRateLimitOptions {
  maxAttempts: number
  windowMs: number
  storageKey: string
}

export function useRateLimit(options: UseRateLimitOptions) {
  const { maxAttempts, windowMs, storageKey } = options
  const [state, setState] = useState<RateLimitState>({
    isBlocked: false,
    remainingTime: 0,
    attemptCount: 0,
  })

  // Load initial state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        const now = Date.now()

        if (data.resetTime > now) {
          const remainingTime = Math.ceil((data.resetTime - now) / 1000)
          const isBlocked = data.attemptCount >= maxAttempts

          setState({
            isBlocked,
            remainingTime: isBlocked ? remainingTime : 0,
            attemptCount: data.attemptCount,
          })

          if (isBlocked) {
            // Log rate limit hit for monitoring
            logAuthEvent('rate_limit_hit', {
              metadata: {
                storageKey,
                attemptCount: data.attemptCount,
                remainingTime,
              },
            })

            // Set timer to unblock when window expires
            const timer = setTimeout(() => {
              setState(prev => ({ ...prev, isBlocked: false, remainingTime: 0 }))
              localStorage.removeItem(storageKey)
            }, remainingTime * 1000)

            return () => clearTimeout(timer)
          }
        } else {
          // Expired, clean up
          localStorage.removeItem(storageKey)
        }
      }
    } catch (error) {
      console.warn('Rate limit storage error:', error)
    }
  }, [storageKey, maxAttempts, windowMs])

  const recordAttempt = useCallback(
    (success: boolean = false) => {
      if (typeof window === 'undefined') return

      const now = Date.now()
      const resetTime = now + windowMs

      try {
        const stored = localStorage.getItem(storageKey)
        let currentCount = 0

        if (stored) {
          const data = JSON.parse(stored)
          if (data.resetTime > now) {
            currentCount = data.attemptCount
          }
        }

        if (success) {
          // Reset on success
          localStorage.removeItem(storageKey)
          setState({
            isBlocked: false,
            remainingTime: 0,
            attemptCount: 0,
          })
          return
        }

        const newCount = currentCount + 1
        const newData = {
          attemptCount: newCount,
          resetTime,
        }

        localStorage.setItem(storageKey, JSON.stringify(newData))

        const isBlocked = newCount >= maxAttempts
        const remainingTime = isBlocked ? Math.ceil(windowMs / 1000) : 0

        setState({
          isBlocked,
          remainingTime,
          attemptCount: newCount,
        })

        if (isBlocked) {
          // Log new rate limit hit for monitoring
          logAuthEvent('rate_limit_hit', {
            metadata: {
              storageKey,
              attemptCount: newCount,
              remainingTime,
            },
          })

          // Set timer to unblock
          const timer = setTimeout(() => {
            setState(prev => ({ ...prev, isBlocked: false, remainingTime: 0 }))
            localStorage.removeItem(storageKey)
          }, windowMs)

          // Store timer cleanup
          return () => clearTimeout(timer)
        }
      } catch (error) {
        console.warn('Rate limit record error:', error)
      }
    },
    [storageKey, maxAttempts, windowMs]
  )

  const reset = useCallback(() => {
    if (typeof window === 'undefined') return

    localStorage.removeItem(storageKey)
    setState({
      isBlocked: false,
      remainingTime: 0,
      attemptCount: 0,
    })
  }, [storageKey])

  // Update remaining time countdown
  useEffect(() => {
    if (!state.isBlocked || state.remainingTime <= 0) return

    const interval = setInterval(() => {
      setState(prev => {
        const newRemainingTime = prev.remainingTime - 1
        if (newRemainingTime <= 0) {
          localStorage.removeItem(storageKey)
          return {
            isBlocked: false,
            remainingTime: 0,
            attemptCount: 0,
          }
        }
        return { ...prev, remainingTime: newRemainingTime }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [state.isBlocked, state.remainingTime, storageKey])

  return {
    ...state,
    recordAttempt,
    reset,
    canAttempt: !state.isBlocked,
    attemptsRemaining: Math.max(0, maxAttempts - state.attemptCount),
  }
}
