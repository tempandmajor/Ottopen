// React Hook for Real-time Collaboration
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  RealtimeCollaborationService,
  type CollaboratorPresence,
} from '@/src/lib/realtime-collaboration'

interface UseCollaborationOptions {
  scriptId: string
  userId: string
  userName: string
  userEmail: string
  onElementUpdate?: (elementId: string, content: string) => void
}

export function useCollaboration({
  scriptId,
  userId,
  userName,
  userEmail,
  onElementUpdate,
}: UseCollaborationOptions) {
  const [presences, setPresences] = useState<Record<string, CollaboratorPresence>>({})
  const [isConnected, setIsConnected] = useState(false)
  const serviceRef = useRef<RealtimeCollaborationService | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize collaboration service
  useEffect(() => {
    if (!scriptId || !userId) return

    const service = new RealtimeCollaborationService(scriptId, userId, userName, userEmail)
    serviceRef.current = service

    // Join collaboration session
    service
      .join(
        presences => setPresences(presences),
        (elementId, content) => {
          if (onElementUpdate) {
            onElementUpdate(elementId, content)
          }
        }
      )
      .then(() => {
        setIsConnected(true)

        // Start heartbeat to keep presence updated
        heartbeatIntervalRef.current = setInterval(() => {
          service.heartbeat()
        }, 5000) // Update every 5 seconds
      })

    // Cleanup on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      service.leave()
      setIsConnected(false)
    }
  }, [scriptId, userId, userName, userEmail, onElementUpdate])

  // Update cursor position
  const updateCursor = useCallback((elementId: string | null, position?: number) => {
    if (serviceRef.current) {
      serviceRef.current.updateCursor(elementId, position)
    }
  }, [])

  // Broadcast element update
  const broadcastUpdate = useCallback((elementId: string, content: string) => {
    if (serviceRef.current) {
      serviceRef.current.broadcastElementUpdate(elementId, content)
    }
  }, [])

  return {
    presences,
    isConnected,
    updateCursor,
    broadcastUpdate,
  }
}
