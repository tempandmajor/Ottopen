'use client'

import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Heart, MessageCircle, Share, BookOpen, Repeat2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface PostCardProps {
  postId?: string
  author: string
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
  onLike?: (postId: string, currentlyLiked: boolean) => Promise<boolean>
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
}

export function PostCard({
  postId,
  author,
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
  onLike,
  onComment,
  onShare,
}: PostCardProps) {
  const [liked, setLiked] = useState(isLiked)
  const [reshared, setReshared] = useState(isReshared)
  const [likeCount, setLikeCount] = useState(likes)
  const [reshareCount, setReshareCount] = useState(reshares)

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
      setLikeCount(newLikedState ? likeCount + 1 : Math.max(0, likeCount - 1))
    } catch (error) {
      console.error('Failed to handle like:', error)
    }
  }

  const handleReshare = () => {
    setReshared(!reshared)
    setReshareCount(reshared ? reshareCount - 1 : reshareCount + 1)
  }

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
            <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-2">
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
              <div className="flex items-center space-x-1 xs:ml-auto">
                <TypeIcon className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground capitalize">{type}</span>
              </div>
            </div>

            <div className="prose prose-sm max-w-none mb-3 sm:mb-4">
              {excerpt ? (
                <blockquote className="border-l-2 pl-3 italic text-muted-foreground">
                  {excerpt}
                </blockquote>
              ) : null}
              <p className="text-foreground text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">
                {content}
              </p>
              {imageUrl ? (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
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
    </Card>
  )
}
