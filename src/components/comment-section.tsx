'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Textarea } from '@/src/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Heart, MessageCircle, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/src/contexts/auth-context'
import { supabase } from '@/src/lib/supabase'
import Link from 'next/link'

interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  parent_comment_id: string | null
  likes_count: number
  created_at: string
  user: {
    id: string
    display_name: string
    username: string
    avatar_url: string | null
  }
  is_liked?: boolean
  replies?: Comment[]
}

interface CommentSectionProps {
  postId: string
  initialCount?: number
}

export function CommentSection({ postId, initialCount = 0 }: CommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'top'>('recent')

  useEffect(() => {
    loadComments()
  }, [postId, sortBy])

  const loadComments = async () => {
    if (!supabase) return

    try {
      setLoading(true)

      // Fetch comments with user data
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select(
          `
          *,
          user:users!comments_user_id_fkey(id, display_name, username, avatar_url)
        `
        )
        .eq('post_id', postId)
        .is('parent_comment_id', null)
        .order(sortBy === 'recent' ? 'created_at' : 'likes_count', { ascending: false })

      if (error) throw error

      // Check which comments current user has liked
      if (user) {
        const { data: likedComments } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentsData?.map(c => c.id) || [])

        const likedSet = new Set(likedComments?.map(l => l.comment_id) || [])

        // Load replies for each comment
        for (const comment of commentsData || []) {
          const { data: replies } = await supabase
            .from('comments')
            .select(
              `
              *,
              user:users!comments_user_id_fkey(id, display_name, username, avatar_url)
            `
            )
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true })

          comment.replies = replies || []
          comment.is_liked = likedSet.has(comment.id)

          // Check likes for replies
          for (const reply of comment.replies) {
            reply.is_liked = likedSet.has(reply.id)
          }
        }

        setComments(commentsData || [])
      } else {
        setComments(commentsData || [])
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || !supabase) return

    try {
      setSubmitting(true)

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select(
          `
          *,
          user:users!comments_user_id_fkey(id, display_name, username, avatar_url)
        `
        )
        .single()

      if (error) throw error

      setComments(prev => [data, ...prev])
      setNewComment('')
      toast.success('Comment posted!')
    } catch (error) {
      console.error('Failed to post comment:', error)
      toast.error('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !user || !supabase) return

    try {
      setSubmitting(true)

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_comment_id: parentId,
        })
        .select(
          `
          *,
          user:users!comments_user_id_fkey(id, display_name, username, avatar_url)
        `
        )
        .single()

      if (error) throw error

      // Add reply to parent comment
      setComments(prev =>
        prev.map(comment =>
          comment.id === parentId
            ? { ...comment, replies: [...(comment.replies || []), data] }
            : comment
        )
      )

      setReplyContent('')
      setReplyingTo(null)
      toast.success('Reply posted!')
    } catch (error) {
      console.error('Failed to post reply:', error)
      toast.error('Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string, currentlyLiked: boolean) => {
    if (!user || !supabase) return

    try {
      if (currentlyLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)
      } else {
        await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id })
      }

      // Update local state
      setComments(prev =>
        prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes_count: currentlyLiked ? comment.likes_count - 1 : comment.likes_count + 1,
              is_liked: !currentlyLiked,
            }
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId
                  ? {
                      ...reply,
                      likes_count: currentlyLiked ? reply.likes_count - 1 : reply.likes_count + 1,
                      is_liked: !currentlyLiked,
                    }
                  : reply
              ),
            }
          }
          return comment
        })
      )
    } catch (error) {
      console.error('Failed to toggle like:', error)
      toast.error('Failed to update like')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !supabase) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error

      // Remove from local state
      setComments(prev => {
        // Check if it's a top-level comment
        const filtered = prev.filter(c => c.id !== commentId)
        // Also check if it's a reply
        return filtered.map(comment => ({
          ...comment,
          replies: comment.replies?.filter(r => r.id !== commentId),
        }))
      })

      toast.success('Comment deleted')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className="flex items-start space-x-3">
        <Link href={`/profile/${comment.user.username}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user.avatar_url || undefined} />
            <AvatarFallback>{comment.user.display_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="bg-muted/50 rounded-lg p-3">
            <Link href={`/profile/${comment.user.username}`} className="hover:underline">
              <p className="font-semibold text-sm">{comment.user.display_name}</p>
            </Link>
            <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
          </div>

          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
            <span>{new Date(comment.created_at).toLocaleDateString()}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => handleLikeComment(comment.id, comment.is_liked || false)}
            >
              <Heart
                className={`h-3 w-3 mr-1 ${comment.is_liked ? 'fill-red-500 text-red-500' : ''}`}
              />
              <span>{comment.likes_count || 0}</span>
            </Button>
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => setReplyingTo(comment.id)}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            {user?.id === comment.user_id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-destructive hover:text-destructive"
                onClick={() => handleDeleteComment(comment.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>

          {/* Reply input */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex items-start space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.profile?.avatar_url || undefined} />
                <AvatarFallback>{user?.profile?.display_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[60px] text-sm"
                  disabled={submitting}
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyContent.trim() || submitting}
                  >
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reply'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant={sortBy === 'recent' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('recent')}
          >
            Recent
          </Button>
          <Button
            variant={sortBy === 'top' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('top')}
          >
            Top
          </Button>
        </div>
      </div>

      {/* New comment input */}
      {user && (
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profile?.avatar_url || undefined} />
            <AvatarFallback>{user.profile?.display_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[80px]"
              disabled={submitting}
            />
            <div className="flex justify-end mt-2">
              <Button onClick={handleSubmitComment} disabled={!newComment.trim() || submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </>
        ) : comments.length > 0 ? (
          comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  )
}
