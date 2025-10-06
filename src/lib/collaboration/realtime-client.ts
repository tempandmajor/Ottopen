// Real-Time Collaboration Client using Supabase Realtime
import { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import type { CollaboratorPresence, EditorChange, Comment } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export class CollaborationClient {
  private channel: RealtimeChannel | null = null
  private manuscriptId: string
  private userId: string
  private userName: string
  private userColor: string

  constructor(manuscriptId: string, userId: string, userName: string, userColor: string) {
    this.manuscriptId = manuscriptId
    this.userId = userId
    this.userName = userName
    this.userColor = userColor
  }

  /**
   * Join a collaboration session
   */
  async join() {
    this.channel = supabase.channel(`manuscript:${this.manuscriptId}`, {
      config: {
        presence: {
          key: this.userId,
        },
      },
    })

    // Track presence
    await this.channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = this.channel?.presenceState()
        // Handle presence state changes
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await this.channel?.track({
            userId: this.userId,
            name: this.userName,
            color: this.userColor,
            lastSeen: new Date().toISOString(),
          })
        }
      })

    return this.channel
  }

  /**
   * Send cursor position
   */
  async updateCursor(line: number, column: number) {
    await this.channel?.track({
      userId: this.userId,
      name: this.userName,
      color: this.userColor,
      cursor: { line, column },
      lastSeen: new Date().toISOString(),
    })
  }

  /**
   * Send selection
   */
  async updateSelection(
    start: { line: number; column: number },
    end: { line: number; column: number }
  ) {
    await this.channel?.track({
      userId: this.userId,
      name: this.userName,
      color: this.userColor,
      selection: { start, end },
      lastSeen: new Date().toISOString(),
    })
  }

  /**
   * Send editor change
   */
  async sendChange(change: EditorChange) {
    await this.channel?.send({
      type: 'broadcast',
      event: 'editor-change',
      payload: change,
    })
  }

  /**
   * Listen for editor changes
   */
  onEditorChange(callback: (change: EditorChange) => void) {
    this.channel?.on('broadcast', { event: 'editor-change' }, ({ payload }) => {
      if (payload.userId !== this.userId) {
        callback(payload)
      }
    })
  }

  /**
   * Send comment
   */
  async sendComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) {
    await this.channel?.send({
      type: 'broadcast',
      event: 'comment-added',
      payload: {
        ...comment,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  }

  /**
   * Listen for comments
   */
  onCommentAdded(callback: (comment: Comment) => void) {
    this.channel?.on('broadcast', { event: 'comment-added' }, ({ payload }) => {
      callback(payload)
    })
  }

  /**
   * Get current collaborators
   */
  getCollaborators(): CollaboratorPresence[] {
    const presenceState = this.channel?.presenceState()
    if (!presenceState) return []

    const collaborators: CollaboratorPresence[] = []
    Object.entries(presenceState).forEach(([key, presences]) => {
      presences.forEach((presence: any) => {
        if (presence.userId !== this.userId) {
          collaborators.push({
            userId: presence.userId,
            name: presence.name,
            email: presence.email || '',
            color: presence.color,
            cursor: presence.cursor,
            selection: presence.selection,
            activeFile: presence.activeFile,
            lastSeen: presence.lastSeen,
          })
        }
      })
    })

    return collaborators
  }

  /**
   * Leave collaboration session
   */
  async leave() {
    await this.channel?.untrack()
    await this.channel?.unsubscribe()
    this.channel = null
  }
}
