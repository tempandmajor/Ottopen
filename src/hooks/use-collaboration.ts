// React Hook for Real-Time Collaboration
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { CollaborationClient } from '@/src/lib/collaboration/realtime-client'
import type { CollaboratorPresence, EditorChange, Comment } from '@/src/lib/collaboration/types'

interface UseCollaborationOptions {
  manuscriptId: string
  userId: string
  userName: string
  userColor?: string
  enabled?: boolean
}

export function useCollaboration({
  manuscriptId,
  userId,
  userName,
  userColor = '#007acc',
  enabled = true,
}: UseCollaborationOptions) {
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<CollaborationClient | null>(null)

  // Initialize collaboration client
  useEffect(() => {
    if (!enabled || !manuscriptId || !userId) return

    const client = new CollaborationClient(manuscriptId, userId, userName, userColor)
    clientRef.current = client

    const initializeClient = async () => {
      try {
        const channel = await client.join()

        // If join failed (returned null), don't set connected state
        if (!channel) {
          console.warn('Failed to join collaboration session - features will be disabled')
          setIsConnected(false)
          return () => {} // Return empty cleanup function
        }

        setIsConnected(true)

        // Listen for presence changes
        const updateCollaborators = () => {
          const currentCollaborators = client.getCollaborators()
          setCollaborators(currentCollaborators)
        }

        // Update collaborators periodically
        const interval = setInterval(updateCollaborators, 1000)

        // Listen for comments
        client.onCommentAdded(comment => {
          setComments(prev => [...prev, comment])
        })

        return () => {
          clearInterval(interval)
          client.leave()
          setIsConnected(false)
        }
      } catch (error) {
        console.error('Error initializing collaboration:', error)
        setIsConnected(false)
        return () => {} // Return empty cleanup function
      }
    }

    const cleanup = initializeClient()

    return () => {
      cleanup.then(fn => fn?.())
    }
  }, [manuscriptId, userId, userName, userColor, enabled])

  // Update cursor position
  const updateCursor = useCallback((line: number, column: number) => {
    clientRef.current?.updateCursor(line, column)
  }, [])

  // Update selection
  const updateSelection = useCallback(
    (start: { line: number; column: number }, end: { line: number; column: number }) => {
      clientRef.current?.updateSelection(start, end)
    },
    []
  )

  // Send editor change
  const sendChange = useCallback((change: EditorChange) => {
    clientRef.current?.sendChange(change)
  }, [])

  // Listen for editor changes
  const onEditorChange = useCallback((callback: (change: EditorChange) => void) => {
    clientRef.current?.onEditorChange(callback)
  }, [])

  // Add comment
  const addComment = useCallback(
    async (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => {
      await clientRef.current?.sendComment(comment)
    },
    []
  )

  return {
    collaborators,
    comments,
    isConnected,
    updateCursor,
    updateSelection,
    sendChange,
    onEditorChange,
    addComment,
  }
}
