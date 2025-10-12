'use client'

import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import {
  Heart,
  MessageCircle,
  Share,
  BookOpen,
  Repeat2,
  MoreHorizontal,
  Trash2,
  Flag,
  Bookmark,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { CommentSection } from '@/src/components/comment-section'
import { Separator } from '@/src/components/ui/separator'
import { sanitizeText, sanitizeUrl } from '@/src/lib/sanitize'

interface PostCardProps {
  postId?: string
  author: string
  authorId?: string
  currentUserId?: string
  isAdmin?: boolean
  avatar?: string
  time: string
  content: string
  type: 'story' | 'excerpt' | 'discussion' | 'announcement'
  excerpt?: string
  imageUrl?: string
  mood?: string
  likes: number
  comments: number
  reshares?: number
  isLiked?: boolean
  isReshared?: boolean
  isBookmarked?: boolean
  onLike?: (postId: string, currentlyLiked: boolean) => Promise<boolean>
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
  onReshare?: (postId: string, comment?: string) => Promise<boolean>
  onBookmark?: (postId: string) => Promise<boolean>
  onDelete?: (postId: string) => void
}

export function PostCard({
  postId,
  author,
  authorId,
  currentUserId,
  isAdmin = false,
  avatar,
  time,
  content,
  excerpt,
  imageUrl,
  mood,
  type,
  likes,
  comments,
  reshares = 0,
  isLiked = false,
  isReshared = false,
  isBookmarked = false,
  onLike,
  onComment,
  onShare,
  onReshare,
  onBookmark,
  onDelete,
}: PostCardProps) {
  const [liked, setLiked] = useState(isLiked)
  const [reshared, setReshared] = useState(isReshared)
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [likeCount, setLikeCount] = useState(likes)
  const [reshareCount, setReshareCount] = useState(reshares)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Sync local state with props when they change
  useEffect(() => {
    setLiked(isLiked)
  }, [isLiked])

  useEffect(() => {
    setReshared(isReshared)
  }, [isReshared])

  useEffect(() => {
    setBookmarked(isBookmarked)
  }, [isBookmarked])

  useEffect(() => {
    setLikeCount(likes)
  }, [likes])

  useEffect(() => {
    setReshareCount(reshares)
  }, [reshares])

  const initials = author
    .split(' ')
    .map(n => n[0])
    .join('')

  const handleLike = async () => {
    if (!postId || !onLike) {
      // Fallback to local state for components without database integration
      setLiked(!liked)
      setLikeCount(liked ? likeCount - 1 : likeCount + 1)
      return
    }

    try {
      const newLikedState = await onLike(postId, liked)
      setLiked(newLikedState)
      // The parent already updates the count, so we don't need to update it here
    } catch (error) {
      console.error('Failed to handle like:', error)
    }
  }

  const handleReshare = async () => {
    if (!postId || !onReshare) {
      // Fallback to local state for components without database integration
      setReshared(!reshared)
      setReshareCount(reshared ? reshareCount - 1 : reshareCount + 1)
      return
    }

    try {
      const newResharedState = await onReshare(postId)
      setReshared(newResharedState)
    } catch (error) {
      console.error('Failed to handle reshare:', error)
    }
  }

  const handleBookmark = async () => {
    if (!postId || !onBookmark) {
      // Fallback to local state
      setBookmarked(!bookmarked)
      return
    }

    try {
      const newBookmarkedState = await onBookmark(postId)
      setBookmarked(newBookmarkedState)
    } catch (error) {
      console.error('Failed to handle bookmark:', error)
    }
  }

  const handleDeletePost = async () => {
    if (!postId) return

    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Post deleted successfully')
        onDelete?.(postId)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      toast.error('Failed to delete post')
    } finally {
      setDeleting(false)
    }
  }

  const handleReportSubmit = async () => {
    if (!postId || !reportReason) {
      toast.error('Please select a reason for reporting')
      return
    }

    setSubmittingReport(true)
    try {
      const response = await fetch(`/api/posts/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription,
        }),
      })

      if (response.ok) {
        toast.success('Report submitted successfully. We will review it shortly.')
        setReportDialogOpen(false)
        setReportReason('')
        setReportDescription('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit report')
      }
    } catch (error) {
      console.error('Failed to report post:', error)
      toast.error('Failed to submit report')
    } finally {
      setSubmittingReport(false)
    }
  }

  const isOwnPost = currentUserId && authorId && currentUserId === authorId
  const canDelete = isOwnPost || isAdmin

  const typeIcons = {
    story: BookOpen,
    excerpt: BookOpen,
    discussion: MessageCircle,
    announcement: Share,
  }

  const TypeIcon = typeIcons[type]

  return (
    <Card className="card-bg card-shadow border-literary-border hover:shadow-md transition-all duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
            <AvatarImage src={avatar} alt={author} />
            <AvatarFallback className="bg-literary-subtle text-foreground font-medium text-xs sm:text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/profile/${author.toLowerCase().replace(' ', '_')}`}
                    className="font-medium text-sm hover:underline truncate"
                  >
                    {author}
                  </Link>
                  <span className="text-muted-foreground text-xs">•</span>
                  <span className="text-muted-foreground text-xs">{time}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TypeIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground capitalize">{type}</span>
                </div>
              </div>

              {/* More Options Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={handleDeletePost}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleting ? 'Deleting...' : 'Delete Post'}
                    </DropdownMenuItem>
                  )}
                  {!isOwnPost && (
                    <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                      <Flag className="h-4 w-4 mr-2" />
                      Report Post
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="prose prose-sm max-w-none mb-3 sm:mb-4">
              {excerpt ? (
                <blockquote className="border-l-2 pl-3 italic text-muted-foreground">
                  {sanitizeText(excerpt)}
                </blockquote>
              ) : null}
              <p className="text-foreground text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">
                {sanitizeText(content)}
              </p>
              {imageUrl ? (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sanitizeUrl(imageUrl)}
                    alt="Post image"
                    className="rounded-md border border-literary-border max-h-[420px] w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between sm:justify-start sm:space-x-6 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 sm:h-8 px-2 ${liked ? 'text-red-500' : ''}`}
                onClick={handleLike}
              >
                <Heart className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${liked ? 'fill-current' : ''}`} />
                <span className="text-xs sm:text-sm">{likeCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 sm:h-8 px-2"
                onClick={() => postId && onComment?.(postId)}
              >
                <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="text-xs sm:text-sm">{comments}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`h-7 sm:h-8 px-2 ${reshared ? 'text-green-500' : ''}`}
                onClick={handleReshare}
              >
                <Repeat2
                  className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${reshared ? 'text-green-500' : ''}`}
                />
                <span className="text-xs sm:text-sm">{reshareCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`h-7 sm:h-8 px-2 ${bookmarked ? 'text-blue-500' : ''}`}
                onClick={handleBookmark}
              >
                <Bookmark className={`h-3 w-3 sm:h-4 sm:w-4 ${bookmarked ? 'fill-current' : ''}`} />
              </Button>

              {mood ? (
                <span className="text-xs sm:text-sm px-2 py-1 rounded border border-literary-border bg-muted">
                  Mood: {mood}
                </span>
              ) : null}

              <Button
                variant="ghost"
                size="sm"
                className="h-7 sm:h-8 px-2"
                onClick={() => postId && onShare?.(postId)}
              >
                <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden xs:inline text-xs sm:text-sm">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Comments Section */}
      {postId && (
        <>
          <Separator />
          <CardContent className="p-4 sm:p-6">
            <CommentSection postId={postId} initialCount={comments} />
          </CardContent>
        </>
      )}

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>
              Help us understand what&apos;s wrong with this post. We&apos;ll review your report and
              take appropriate action.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for reporting *</Label>
              <select
                id="reason"
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">Select a reason</option>
                <option value="spam">Spam or misleading</option>
                <option value="harassment">Harassment or hate speech</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="misinformation">Misinformation</option>
                <option value="copyright">Copyright violation</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional details (optional)</Label>
              <Textarea
                id="description"
                value={reportDescription}
                onChange={e => setReportDescription(e.target.value)}
                placeholder="Provide any additional information that might help us review this report..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReportDialogOpen(false)}
              disabled={submittingReport}
            >
              Cancel
            </Button>
            <Button onClick={handleReportSubmit} disabled={!reportReason || submittingReport}>
              {submittingReport ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
