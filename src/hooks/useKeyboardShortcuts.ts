'use client'

import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  handler: (e: KeyboardEvent) => void
  description?: string
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === e.ctrlKey
        const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === e.metaKey
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === e.shiftKey
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === e.altKey
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

        // Match Cmd on Mac or Ctrl on Windows/Linux
        const modifierMatch = shortcut.metaKey || shortcut.ctrlKey ? metaMatch || ctrlMatch : true

        if (keyMatch && modifierMatch && shiftMatch && altMatch) {
          e.preventDefault()
          shortcut.handler(e)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}
