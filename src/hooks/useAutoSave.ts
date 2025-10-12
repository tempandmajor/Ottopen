'use client'

import { useEffect, useRef, useState } from 'react'

interface UseAutoSaveOptions {
  onSave: () => Promise<void>
  interval?: number // milliseconds
  enabled?: boolean
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
}: UseAutoSaveOptions) {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    error: null,
  })
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

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
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState({
          isSaving: false,
          lastSaved: null,
          error: error instanceof Error ? error.message : 'Save failed',
        })
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
      return
    }

    saveTimeoutRef.current = setInterval(() => {
      save()
    }, interval)

    return () => {
      if (saveTimeoutRef.current) {
        clearInterval(saveTimeoutRef.current)
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

  return {
    ...state,
    save, // Manual save function
  }
}
