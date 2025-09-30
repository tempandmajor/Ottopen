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
import { isSupabaseConfigured, supabase } from '@/src/lib/supabase'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function Feed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [creatingPost, setCreatingPost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostExcerpt, setNewPostExcerpt] = useState('')
  const [newPostMood, setNewPostMood] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [followingCount, setFollowingCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  // Load liked posts for the current user
  const loadLikedPosts = async () => {
    if (!user) return

    try {
      // Get all posts that the user has liked
      const userLikes = await dbService.getUserLikedPosts(user.id)
      const likedPostIds = new Set(userLikes.map(post => post.id))
      setLikedPosts(likedPostIds)
    } catch (error) {
      console.error('Failed to load liked posts:', error)
    }
  }

  // Handle post interactions
  const handleLikePost = async (postId: string, currentlyLiked: boolean): Promise<boolean> => {
    if (!user) return currentlyLiked

    try {
      const newLikedState = await dbService.toggleLike(postId, user.id)

      // Update the post in the local state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                likes_count: newLikedState
                  ? (post.likes_count || 0) + 1
                  : Math.max(0, (post.likes_count || 0) - 1),
              }
            : post
        )
      )

      // Update local liked posts state
      if (newLikedState) {
        setLikedPosts(prev => new Set([...prev, postId]))
      } else {
        setLikedPosts(prev => {
          const updated = new Set(prev)
          updated.delete(postId)
          return updated
        })
      }

      return newLikedState
    } catch (error) {
      console.error('Failed to toggle like:', error)
      toast.error('Failed to update like')
      return currentlyLiked
    }
  }

  const handleCommentPost = (postId: string) => {
    // TODO: Navigate to post detail page or open comment modal
    console.log('Comment on post:', postId)
    toast('Comment functionality coming soon!')
  }

  const handleSharePost = async (postId: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post on Script Soirée',
          url: `${window.location.origin}/posts/${postId}`,
        })
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`)
        toast.success('Post link copied to clipboard!')
      }
    } catch (error) {
      console.error('Failed to share post:', error)
      toast.error('Failed to share post')
    }
  }

  console.log('=== FEED PAGE COMPONENT LOADED ===')
  console.log('Feed page - userExists:', !!user)

  // Load initial data
  useEffect(() => {
    if (user) {
      loadFeedData()
      loadFollowingCount()
      loadLikedPosts()
    }
  }, [user])

  const loadFeedData = async (pageNum = 0) => {
    try {
      setLoading(pageNum === 0)
      setLoadingMore(pageNum > 0)

      // Load posts from followed users, fall back to all posts if user follows no one
      let feedPosts: Post[] = []

      if (user) {
        const following = await dbService.getFollowing(user.id)

        if (following.length > 0) {
          // Get posts from followed users
          const followingIds = following.map(f => f.id)
          const allPosts = await dbService.getPosts({
            limit: 50, // Get more to filter
            offset: 0,
            published: true,
          })

          // Filter posts by followed users
          feedPosts = allPosts
            .filter(post => followingIds.includes(post.user_id))
            .slice(pageNum * 10, (pageNum + 1) * 10)
        } else {
          // User follows no one, show all posts to help them discover content
          feedPosts = await dbService.getPosts({
            limit: 10,
            offset: pageNum * 10,
            published: true,
          })
        }
      }

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

      // Upload image if selected
      let imageUrl: string | undefined
      if (imageFile) {
        setUploadingImage(true)
        const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('post-images')
          .upload(path, imageFile, { cacheControl: '3600', upsert: false })
        if (upErr) {
          console.error('Image upload failed:', upErr)
          toast.error('Image upload failed')
        } else {
          const { data } = supabase.storage.from('post-images').getPublicUrl(path)
          imageUrl = data.publicUrl
        }
        setUploadingImage(false)
      }

      const newPost = await dbService.createPost({
        user_id: user.id,
        title: '',
        content: newPostContent.trim(),
        excerpt: newPostExcerpt.trim() || undefined,
        mood: newPostMood || undefined,
        image_url: imageUrl,
        published: true,
      })

      if (newPost) {
        // Add the new post to the top of the feed
        setPosts(prev => [newPost, ...prev])
        setNewPostContent('')
        setNewPostExcerpt('')
        setNewPostMood('')
        setImageFile(null)
        setImagePreview('')
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

                    {/* Optional excerpt */}
                    <Textarea
                      value={newPostExcerpt}
                      onChange={e => setNewPostExcerpt(e.target.value)}
                      placeholder="Optional: add an excerpt to highlight (renders as blockquote)"
                      className="min-h-[60px] resize-none border-literary-border text-xs sm:text-sm"
                      disabled={creatingPost}
                    />

                    {/* Image preview */}
                    {imagePreview && (
                      <div className="rounded-md border border-literary-border overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-64 w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
                        <input
                          id="post-image-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0] || null
                            if (!file) {
                              setImageFile(null)
                              setImagePreview('')
                              return
                            }
                            const allowed = ['image/jpeg', 'image/png', 'image/webp']
                            const maxBytes = 5 * 1024 * 1024
                            if (!allowed.includes(file.type)) {
                              toast.error('Unsupported image type. Use JPG, PNG, or WebP')
                              ;(e.target as HTMLInputElement).value = ''
                              setImageFile(null)
                              setImagePreview('')
                              return
                            }
                            if (file.size > maxBytes) {
                              toast.error('Image too large. Max size is 5MB')
                              ;(e.target as HTMLInputElement).value = ''
                              setImageFile(null)
                              setImagePreview('')
                              return
                            }
                            setImageFile(file)
                            setImagePreview(URL.createObjectURL(file))
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={creatingPost || uploadingImage}
                          onClick={() => document.getElementById('post-image-input')?.click()}
                        >
                          <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span>{uploadingImage ? 'Uploading...' : 'Image'}</span>
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
                        <div className="inline-flex items-center space-x-2">
                          <Smile className="h-3 w-3 sm:h-4 sm:w-4" />
                          <select
                            className="border border-literary-border rounded px-2 py-1 text-xs sm:text-sm bg-background"
                            value={newPostMood}
                            onChange={e => setNewPostMood(e.target.value)}
                            disabled={creatingPost}
                          >
                            <option value="">Mood</option>
                            <option value="inspired">Inspired</option>
                            <option value="reflective">Reflective</option>
                            <option value="celebratory">Celebratory</option>
                            <option value="seeking_feedback">Seeking Feedback</option>
                            <option value="announcement">Announcement</option>
                          </select>
                        </div>
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
                    postId={post.id}
                    author={post.user?.display_name || post.user?.username || 'Unknown Author'}
                    avatar={post.user?.avatar_url}
                    time={new Date(post.created_at).toLocaleDateString()}
                    content={post.content}
                    excerpt={post.excerpt}
                    imageUrl={post.image_url}
                    mood={post.mood}
                    type="discussion"
                    likes={post.likes_count || 0}
                    comments={post.comments_count || 0}
                    isLiked={likedPosts.has(post.id)}
                    onLike={handleLikePost}
                    onComment={handleCommentPost}
                    onShare={handleSharePost}
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
