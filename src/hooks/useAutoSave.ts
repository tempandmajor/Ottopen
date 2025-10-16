'use client'

import { useEffect, useRef, useState } from 'react'

interface UseAutoSaveOptions {
  onSave: () => Promise<void>
  interval?: number // milliseconds
  enabled?: boolean
  maxRetries?: number // exponential backoff retries on failure
  retryBaseMs?: number // base delay for backoff
  beforeUnloadSave?: boolean // attempt a save on page close when enabled
}

interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
}

const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export function useAutoSave({
  onSave,
  interval = AUTO_SAVE_INTERVAL,
  enabled = true,
  maxRetries = 3,
  retryBaseMs = 2000,
  beforeUnloadSave = true,
}: UseAutoSaveOptions) {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    error: null,
  })
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)

  // Manual save function
  const save = async () => {
    if (state.isSaving) return

    setState(prev => ({ ...prev, isSaving: true, error: null }))

    try {
      await onSave()
      if (isMountedRef.current) {
        setState({
          isSaving: false,
          lastSaved: new Date(),
          error: null,
        })
        // Reset retry state on success
        retryCountRef.current = 0
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
          retryTimeoutRef.current = null
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState({
          isSaving: false,
          lastSaved: null,
          error: error instanceof Error ? error.message : 'Save failed',
        })
        // Schedule exponential backoff retry
        if (retryCountRef.current < maxRetries) {
          const delay = retryBaseMs * Math.pow(2, retryCountRef.current)
          retryCountRef.current += 1
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
          retryTimeoutRef.current = setTimeout(() => {
            // Only retry if still enabled and mounted
            if (isMountedRef.current && enabled) {
              save()
            }
          }, delay)
        }
      }
    }
  }

  // Auto-save interval
  useEffect(() => {
    if (!enabled) {
      if (saveTimeoutRef.current) {
        clearInterval(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      return
    }

    saveTimeoutRef.current = setInterval(() => {
      save()
    }, interval)

    return () => {
      if (saveTimeoutRef.current) {
        clearInterval(saveTimeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Attempt save on page unload if enabled
  useEffect(() => {
    if (!beforeUnloadSave) return
    const handler = (e: BeforeUnloadEvent) => {
      if (!enabled) return
      // Fire-and-forget; do not block unload
      try {
        save()
      } catch (_) {
        // ignore
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, beforeUnloadSave])

  return {
    ...state,
    save, // Manual save function
  }
}
