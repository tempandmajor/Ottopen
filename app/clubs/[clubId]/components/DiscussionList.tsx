'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Plus, TrendingUp, Clock, Pin } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { ClubDiscussion } from '@/src/lib/book-club-service'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { CreateDiscussionDialog } from './CreateDiscussionDialog'
import { sanitizeText } from '@/src/lib/sanitize'

interface DiscussionListProps {
  clubId: string
  isMember: boolean
}

export function DiscussionList({ clubId, isMember }: DiscussionListProps) {
  const [discussions, setDiscussions] = useState<ClubDiscussion[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    loadDiscussions()
  }, [clubId, sortBy])

  const loadDiscussions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/book-clubs/${clubId}/discussions?sort=${sortBy}`)
      const data = await response.json()
      setDiscussions(data.discussions || [])
    } catch (error) {
      console.error('Failed to load discussions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDiscussionCreated = (discussion: ClubDiscussion) => {
    setDiscussions([discussion, ...discussions])
    setCreateDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('recent')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Recent
          </Button>
          <Button
            variant={sortBy === 'popular' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('popular')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Popular
          </Button>
        </div>
        {isMember && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Discussion
          </Button>
        )}
      </div>

      {/* Discussions List */}
      {discussions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
            <p className="text-muted-foreground mb-4">
              {isMember
                ? 'Start the conversation by creating the first discussion!'
                : 'Join this club to participate in discussions'}
            </p>
            {isMember && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Discussion
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {discussions.map(discussion => (
            <Link key={discussion.id} href={`/clubs/${clubId}/discussions/${discussion.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {discussion.author_id?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                          {sanitizeText(discussion.title)}
                        </h3>
                        {discussion.pinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="h-3 w-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {sanitizeText(discussion.content)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {discussion.reply_count} replies
                        </div>
                        <div>
                          {formatDistanceToNow(new Date(discussion.created_at), {
                            addSuffix: true,
                          })}
                        </div>
                        {discussion.last_reply_at && (
                          <div>
                            Last reply{' '}
                            {formatDistanceToNow(new Date(discussion.last_reply_at), {
                              addSuffix: true,
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Discussion Dialog */}
      <CreateDiscussionDialog
        clubId={clubId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onDiscussionCreated={handleDiscussionCreated}
      />
    </div>
  )
}
