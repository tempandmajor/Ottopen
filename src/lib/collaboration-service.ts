import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface CollaboratorPresence {
  userId: string
  userName: string
  userAvatar?: string
  cursorPosition?: number
  selection?: { from: number; to: number }
  color: string
}

export interface CollaborationEvent {
  type: 'cursor-move' | 'selection-change' | 'content-update'
  userId: string
  data: unknown
  timestamp: number
}

export class CollaborationService {
  private channel: RealtimeChannel | null = null
  private collaborators = new Map<string, CollaboratorPresence>()
  private onPresenceChangeCallback?: (collaborators: Map<string, CollaboratorPresence>) => void
  private onEventCallback?: (event: CollaborationEvent) => void

  constructor(
    private documentId: string,
    private currentUser: { id: string; name: string; avatar?: string }
  ) {}

  async connect() {
    if (!supabase) {
      throw new Error('Supabase client not configured')
    }

    const userColor = this.generateColor(this.currentUser.id)

    this.channel = supabase.channel(`document:${this.documentId}`, {
      config: {
        presence: {
          key: this.currentUser.id,
        },
      },
    })

    // Track presence
    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel?.presenceState() || {}
        this.collaborators.clear()

        Object.entries(state).forEach(([userId, presences]) => {
          const presence = presences[0] as CollaboratorPresence
          if (presence && userId !== this.currentUser.id) {
            this.collaborators.set(userId, presence)
          }
        })

        this.onPresenceChangeCallback?.(this.collaborators)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== this.currentUser.id) {
          const presence = newPresences[0] as CollaboratorPresence
          this.collaborators.set(key, presence)
          this.onPresenceChangeCallback?.(this.collaborators)
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        this.collaborators.delete(key)
        this.onPresenceChangeCallback?.(this.collaborators)
      })

    // Listen for collaboration events
    this.channel.on('broadcast', { event: 'collaboration-event' }, ({ payload }) => {
      if (payload.userId !== this.currentUser.id) {
        this.onEventCallback?.(payload as CollaborationEvent)
      }
    })

    await this.channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await this.channel?.track({
          userId: this.currentUser.id,
          userName: this.currentUser.name,
          userAvatar: this.currentUser.avatar,
          color: userColor,
        })
      }
    })
  }

  updateCursor(position: number) {
    this.channel?.track({
      cursorPosition: position,
    })
  }

  updateSelection(from: number, to: number) {
    this.channel?.track({
      selection: { from, to },
    })
  }

  broadcastEvent(event: Omit<CollaborationEvent, 'userId' | 'timestamp'>) {
    this.channel?.send({
      type: 'broadcast',
      event: 'collaboration-event',
      payload: {
        ...event,
        userId: this.currentUser.id,
        timestamp: Date.now(),
      },
    })
  }

  onPresenceChange(callback: (collaborators: Map<string, CollaboratorPresence>) => void) {
    this.onPresenceChangeCallback = callback
  }

  onEvent(callback: (event: CollaborationEvent) => void) {
    this.onEventCallback = callback
  }

  async disconnect() {
    if (this.channel) {
      await this.channel.unsubscribe()
      this.channel = null
      this.collaborators.clear()
    }
  }

  getCollaborators() {
    return this.collaborators
  }

  private generateColor(userId: string): string {
    // Generate a consistent color based on userId
    const colors = [
      '#3B82F6', // Blue
      '#EF4444', // Red
      '#10B981', // Green
      '#F59E0B', // Amber
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#F97316', // Orange
    ]

    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
  }
}
