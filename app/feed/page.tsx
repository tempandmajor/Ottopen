'use client'

import { Navigation } from '@/src/components/navigation'
import { PostCard } from '@/src/components/post-card'
import { ProtectedRoute } from '@/src/components/auth/protected-route'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { PenTool, Image as ImageIcon, Smile, Filter, Loader2 } from 'lucide-react'
import { useAuth } from '@/src/contexts/auth-context'
import { useState, useEffect } from 'react'
import { dbService } from '@/src/lib/database'
import type { User, Post } from '@/src/lib/supabase'
import { isSupabaseConfigured } from '@/src/lib/supabase'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function Feed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [creatingPost, setCreatingPost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [followingCount, setFollowingCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  console.log('Feed page - User:', user ? user.email : 'null')

  // Load initial data
  useEffect(() => {
    if (user) {
      loadFeedData()
      loadFollowingCount()
    }
  }, [user])

  const loadFeedData = async (pageNum = 0) => {
    try {
      setLoading(pageNum === 0)
      setLoadingMore(pageNum > 0)

      // Load posts from followed users (for now, load all published posts)
      const feedPosts = await dbService.getPosts({
        limit: 10,
        offset: pageNum * 10,
        published: true,
      })

      if (pageNum === 0) {
        setPosts(feedPosts)
      } else {
        setPosts(prev => [...prev, ...feedPosts])
      }

      setHasMore(feedPosts.length === 10)
    } catch (error) {
      console.error('Failed to load feed:', error)
      toast.error('Failed to load feed')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadFollowingCount = async () => {
    try {
      if (user) {
        const following = await dbService.getFollowing(user.id)
        setFollowingCount(following.length)
      }
    } catch (error) {
      console.error('Failed to load following count:', error)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return

    try {
      setCreatingPost(true)

      const newPost = await dbService.createPost({
        user_id: user.id,
        title: '',
        content: newPostContent.trim(),
        published: true,
      })

      if (newPost) {
        // Add the new post to the top of the feed
        setPosts(prev => [newPost, ...prev])
        setNewPostContent('')
        toast.success('Post shared successfully!')
      } else {
        toast.error('Failed to create post')
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error('Failed to create post')
    } finally {
      setCreatingPost(false)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadFeedData(nextPage)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleCreatePost()
    }
  }

  console.log('Feed page rendering...')

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold">Your Feed</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Latest updates from writers you follow
              </p>
            </div>

            {/* Create Post */}
            <Card className="card-bg card-shadow border-literary-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarImage
                      src={user?.profile?.avatar_url}
                      alt={user?.profile?.display_name || user?.email}
                    />
                    <AvatarFallback className="bg-literary-subtle text-foreground font-medium text-xs sm:text-sm">
                      {(user?.profile?.display_name || user?.email)?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                    <Textarea
                      value={newPostContent}
                      onChange={e => setNewPostContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Share your writing journey, an excerpt, or start a discussion... (Ctrl+Enter to post)"
                      className="min-h-[80px] sm:min-h-[100px] resize-none border-literary-border text-sm sm:text-base"
                      disabled={creatingPost}
                    />

                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs sm:h-8 sm:text-sm whitespace-nowrap"
                          disabled={creatingPost}
                        >
                          <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span>Image</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs sm:h-8 sm:text-sm whitespace-nowrap"
                          disabled={creatingPost}
                        >
                          <PenTool className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span>Excerpt</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs sm:h-8 sm:text-sm whitespace-nowrap"
                          disabled={creatingPost}
                        >
                          <Smile className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span>Mood</span>
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        className="font-medium self-end xs:self-auto"
                        onClick={handleCreatePost}
                        disabled={!newPostContent.trim() || creatingPost}
                      >
                        {creatingPost ? (
                          <>
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" />
                            <span>Sharing...</span>
                          </>
                        ) : (
                          <span>Share</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filter Options */}
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Following {followingCount} writers
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="self-start xs:self-auto text-xs sm:text-sm"
                asChild
              >
                <Link href="/search?type=posts">Filter Posts</Link>
              </Button>
            </div>

            {/* Posts Feed */}
            <div className="space-y-3 sm:space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading your feed...</p>
                </div>
              ) : posts.length > 0 ? (
                posts.map(post => (
                  <PostCard
                    key={post.id}
                    author={post.user?.display_name || post.user?.username || 'Unknown Author'}
                    avatar={post.user?.avatar_url}
                    time={new Date(post.created_at).toLocaleDateString()}
                    content={post.content}
                    type="discussion"
                    likes={post.likes_count || 0}
                    comments={post.comments_count || 0}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No posts in your feed yet.</p>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <Link href="/authors" className="text-primary hover:underline">
                        Follow some writers
                      </Link>{' '}
                      to see their posts here.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Or{' '}
                      <Link href="/search" className="text-primary hover:underline">
                        explore the community
                      </Link>{' '}
                      to discover amazing content.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Load More */}
            {posts.length > 0 && hasMore && (
              <div className="text-center pt-6 sm:pt-8">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full xs:w-auto"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Posts'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
