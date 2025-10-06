'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, ThumbsUp, Reply, MoreVertical, Pin, Lock, Trash2 } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader } from '@/src/components/ui/card'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { Textarea } from '@/src/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { ClubDiscussion, DiscussionReply } from '@/src/lib/book-club-service'
import { formatDistanceToNow } from 'date-fns'

interface DiscussionThreadProps {
  discussion: ClubDiscussion
  userRole?: 'owner' | 'moderator' | 'member'
  onReply?: (content: string, parentId?: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onPin?: (id: string) => Promise<void>
  onLock?: (id: string) => Promise<void>
}

export function DiscussionThread({
  discussion,
  userRole,
  onReply,
  onDelete,
  onPin,
  onLock,
}: DiscussionThreadProps) {
  const [replies, setReplies] = useState<DiscussionReply[]>([])
  const [replyContent, setReplyContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadReplies()
  }, [discussion.id])

  const loadReplies = async () => {
    try {
      const response = await fetch(`/api/book-clubs/discussions/${discussion.id}/replies`)
      const data = await response.json()
      setReplies(data.replies || [])
    } catch (error) {
      console.error('Failed to load replies:', error)
    }
  }

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !onReply) return

    setLoading(true)
    try {
      await onReply(replyContent, replyingTo || undefined)
      setReplyContent('')
      setReplyingTo(null)
      await loadReplies()
    } catch (error) {
      console.error('Failed to post reply:', error)
    } finally {
      setLoading(false)
    }
  }

  const canModerate = userRole === 'owner' || userRole === 'moderator'

  return (
    <div className="space-y-4">
      {/* Main Discussion Post */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Avatar>
                <AvatarFallback>
                  {discussion.author_id?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{discussion.title}</h3>
                  {discussion.pinned && (
                    <Badge variant="secondary" className="text-xs">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                  {discussion.locked && (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {canModerate && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPin?.(discussion.id)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {discussion.pinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onLock?.(discussion.id)}>
                    <Lock className="h-4 w-4 mr-2" />
                    {discussion.locked ? 'Unlock' : 'Lock'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete?.(discussion.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none mb-4">
            <p className="whitespace-pre-wrap">{discussion.content}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {discussion.reply_count} replies
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              {discussion.view_count} views
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      <div className="space-y-3">
        {replies.map(reply => (
          <ReplyCard
            key={reply.id}
            reply={reply}
            onReply={() => setReplyingTo(reply.id)}
            canDelete={canModerate}
            onDelete={() => onDelete?.(reply.id)}
          />
        ))}
      </div>

      {/* Reply Form */}
      {!discussion.locked && (
        <Card>
          <CardContent className="pt-6">
            {replyingTo && (
              <div className="mb-3 text-sm text-muted-foreground">
                Replying to comment...{' '}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="h-auto p-0 text-blue-600"
                >
                  Cancel
                </Button>
              </div>
            )}
            <Textarea
              placeholder="Write your reply..."
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              className="mb-3"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={handleSubmitReply} disabled={!replyContent.trim() || loading}>
                <Reply className="h-4 w-4 mr-2" />
                {loading ? 'Posting...' : 'Post Reply'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface ReplyCardProps {
  reply: DiscussionReply
  onReply: () => void
  canDelete: boolean
  onDelete: () => void
}

function ReplyCard({ reply, onReply, canDelete, onDelete }: ReplyCardProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className={`border rounded-lg p-4 ${reply.parent_reply_id ? 'ml-12' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{reply.author_id?.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
            </p>
            {showActions && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onReply}>
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                {canDelete && (
                  <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
          <p className="mt-2 text-sm whitespace-pre-wrap">{reply.content}</p>
          {reply.helpful_count > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <ThumbsUp className="h-3 w-3" />
              {reply.helpful_count} helpful
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
