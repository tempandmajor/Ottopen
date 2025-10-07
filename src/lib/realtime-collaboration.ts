// Real-time Collaboration Service
// Live presence, cursors, and concurrent editing

import { supabase } from '@/src/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface CollaboratorPresence {
  userId: string
  userName: string
  userEmail: string
  color: string
  cursor?: {
    elementId: string
    position: number
  }
  lastActive: number
}

export interface EditOperation {
  elementId: string
  userId: string
  timestamp: number
  operation: 'insert' | 'delete' | 'replace'
  content: string
  position?: number
}

const PRESENCE_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]

export class RealtimeCollaborationService {
  private channel: RealtimeChannel | null = null
  private scriptId: string
  private userId: string
  private userName: string
  private userEmail: string
  private color: string

  constructor(scriptId: string, userId: string, userName: string, userEmail: string) {
    this.scriptId = scriptId
    this.userId = userId
    this.userName = userName
    this.userEmail = userEmail
    // Assign color based on userId hash
    const colorIndex = Math.abs(this.hashCode(userId)) % PRESENCE_COLORS.length
    this.color = PRESENCE_COLORS[colorIndex]
  }

  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return hash
  }

  /**
   * Join the collaboration session
   */
  async join(
    onPresenceChange: (presences: Record<string, CollaboratorPresence>) => void,
    onElementUpdate: (elementId: string, content: string) => void
  ): Promise<void> {
    if (!supabase) {
      console.warn('Supabase client not available for realtime collaboration')
      return
    }

    // Create channel for this script
    this.channel = supabase.channel(`script:${this.scriptId}`)

    // Track presence
    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel?.presenceState() || {}
        const presences: Record<string, CollaboratorPresence> = {}

        Object.keys(state).forEach(key => {
          const presenceArray = state[key] as any[]
          if (presenceArray && presenceArray.length > 0) {
            const presence = presenceArray[0] as CollaboratorPresence
            if (presence.userId && presence.userId !== this.userId) {
              presences[presence.userId] = presence
            }
          }
        })

        onPresenceChange(presences)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences)
      })

    // Listen for element updates from other users
    this.channel.on('broadcast' as any, { event: 'element-update' }, (payload: any) => {
      if (payload.payload && payload.payload.userId !== this.userId) {
        onElementUpdate(payload.payload.elementId, payload.payload.content)
      }
    })

    // Subscribe and track presence
    await this.channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await this.channel?.track({
          userId: this.userId,
          userName: this.userName,
          userEmail: this.userEmail,
          color: this.color,
          lastActive: Date.now(),
        })
      }
    })
  }

  /**
   * Update cursor position
   */
  async updateCursor(elementId: string | null, position?: number): Promise<void> {
    if (!this.channel) return

    await this.channel.track({
      userId: this.userId,
      userName: this.userName,
      userEmail: this.userEmail,
      color: this.color,
      cursor: elementId
        ? {
            elementId,
            position: position || 0,
          }
        : undefined,
      lastActive: Date.now(),
    })
  }

  /**
   * Broadcast element update to other collaborators
   */
  async broadcastElementUpdate(elementId: string, content: string): Promise<void> {
    if (!this.channel) return

    await this.channel.send({
      type: 'broadcast',
      event: 'element-update',
      payload: {
        elementId,
        content,
        userId: this.userId,
        timestamp: Date.now(),
      },
    })
  }

  /**
   * Leave the collaboration session
   */
  async leave(): Promise<void> {
    if (this.channel) {
      await this.channel.untrack()
      await this.channel.unsubscribe()
      this.channel = null
    }
  }

  /**
   * Update last active timestamp
   */
  async heartbeat(): Promise<void> {
    if (!this.channel) return

    await this.channel.track({
      userId: this.userId,
      userName: this.userName,
      userEmail: this.userEmail,
      color: this.color,
      lastActive: Date.now(),
    })
  }
}

/**
 * Operational Transformation for conflict resolution
 * Simplified version for handling concurrent edits
 */
export class OperationalTransform {
  /**
   * Transform two concurrent operations
   * Returns transformed version of op1 that can be applied after op2
   */
  static transform(op1: EditOperation, op2: EditOperation): EditOperation | null {
    // If operations are on different elements, no conflict
    if (op1.elementId !== op2.elementId) {
      return op1
    }

    // If op2 happened before op1, no transformation needed
    if (op2.timestamp < op1.timestamp) {
      return op1
    }

    // Same element, same time - use userId as tiebreaker
    if (op2.timestamp === op1.timestamp) {
      if (op2.userId < op1.userId) {
        return op1
      }
      return null // Discard op1
    }

    // op2 happened after op1 started - transform based on operation types
    const pos1 = op1.position || 0
    const pos2 = op2.position || 0

    if (op2.operation === 'insert') {
      // Shift op1 position if op2 inserted before it
      if (pos2 <= pos1) {
        return {
          ...op1,
          position: pos1 + op2.content.length,
        }
      }
    } else if (op2.operation === 'delete') {
      // Adjust op1 position if op2 deleted before it
      if (pos2 < pos1) {
        return {
          ...op1,
          position: Math.max(pos2, pos1 - op2.content.length),
        }
      }
    }

    return op1
  }

  /**
   * Merge multiple operations into a single operation
   */
  static merge(operations: EditOperation[]): string | null {
    if (operations.length === 0) return null
    if (operations.length === 1) return operations[0].content

    // Sort by timestamp
    const sorted = operations.sort((a, b) => a.timestamp - b.timestamp)

    // Apply operations in order
    let result = sorted[0].content
    for (let i = 1; i < sorted.length; i++) {
      const transformed = this.transform(sorted[i], sorted[i - 1])
      if (transformed) {
        result = transformed.content
      }
    }

    return result
  }
}
