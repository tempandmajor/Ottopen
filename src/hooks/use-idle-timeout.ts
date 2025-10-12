import { useEffect, useCallback, useRef } from 'react'

interface UseIdleTimeoutOptions {
  timeout: number // Idle timeout in milliseconds
  onTimeout: () => void // Callback when timeout occurs
  onWarning?: (timeLeft: number) => void // Optional warning callback
  warningTime?: number // Show warning X seconds before timeout
  events?: string[] // DOM events to track for activity
}

export function useIdleTimeout(options: UseIdleTimeoutOptions) {
  const {
    timeout,
    onTimeout,
    onWarning,
    warningTime = 60000, // Default 1 minute warning
    events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
  } = options

  const timeoutRef = useRef<NodeJS.Timeout>()
  const warningTimeoutRef = useRef<NodeJS.Timeout>()
  const lastActivityRef = useRef<number>(Date.now())

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
    }

    // Set warning timer
    if (onWarning && warningTime < timeout) {
      warningTimeoutRef.current = setTimeout(() => {
        const timeLeft = timeout - warningTime
        onWarning(timeLeft)
      }, timeout - warningTime)
    }

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      onTimeout()
    }, timeout)
  }, [timeout, onTimeout, onWarning, warningTime])

  const handleActivity = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    // Initial timer setup
    resetTimer()

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      // Cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }

      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [events, handleActivity, resetTimer])

  const getRemainingTime = useCallback(() => {
    const now = Date.now()
    const elapsed = now - lastActivityRef.current
    return Math.max(0, timeout - elapsed)
  }, [timeout])

  const extend = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  return {
    getRemainingTime,
    extend,
    reset: resetTimer,
  }
}
