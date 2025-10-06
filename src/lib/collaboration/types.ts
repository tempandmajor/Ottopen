// Collaboration Types for Real-Time Editing

export interface CollaboratorPresence {
  userId: string
  name: string
  email: string
  avatarUrl?: string
  color: string
  cursor?: {
    line: number
    column: number
  }
  selection?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  activeFile?: string
  lastSeen: string
}

export interface EditorChange {
  userId: string
  type: 'insert' | 'delete' | 'replace'
  position: {
    line: number
    column: number
  }
  content: string
  timestamp: string
}

export interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  sceneId: string
  manuscriptId: string
  content: string
  position: {
    line: number
    column: number
  }
  resolved: boolean
  createdAt: string
  updatedAt: string
  replies?: CommentReply[]
}

export interface CommentReply {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: string
}

export interface CollaborationSession {
  manuscriptId: string
  userId: string
  collaborators: Map<string, CollaboratorPresence>
  comments: Comment[]
}
