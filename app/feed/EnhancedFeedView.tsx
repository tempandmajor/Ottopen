'use client'

import { PostCard } from '@/src/components/post-card'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Textarea } from '@/src/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import Image from 'next/image'
import {
  PenTool,
  Image as ImageIcon,
  Smile,
  Filter,
  Loader2,
  TrendingUp,
  Compass,
  Users,
  Bookmark,
  Repeat2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { dbService } from '@/src/lib/database'
import type { User, Post } from '@/src/lib/supabase'
import { supabase } from '@/src/lib/supabase'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

type FeedView = 'following' | 'discover' | 'trending'

interface FeedFilters {
  genres: string[]
  moods: string[]
  sortBy: 'recent' | 'popular'
}

interface EnhancedFeedViewProps {
  user: (User & { profile?: any }) | null
}

export default function EnhancedFeedView({ user }: EnhancedFeedViewProps) {
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
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [resharedPosts, setResharedPosts] = useState<Set<string>>(new Set())
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set())
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedView, setFeedView] = useState<FeedView>('following')
  const [filters, setFilters] = useState<FeedFilters>({
    genres: [],
    moods: [],
    sortBy: 'recent',
  })
  const [newPostsAvailable, setNewPostsAvailable] = useState(false)
  const MAX_CONTENT_LENGTH = 5000

  const availableGenres = [
    'Fiction',
    'Non-Fiction',
    'Poetry',
    'Screenplay',
    'Memoir',
    'Fantasy',
    'Sci-Fi',
    'Romance',
    'Thriller',
  ]
  const availableMoods = [
    'inspired',
    'reflective',
    'celebratory',
    'seeking_feedback',
    'announcement',
  ]

  // Load initial data
  useEffect(() => {
    if (user) {
      Promise.all([
        loadFeedData(),
        loadLikedPosts(),
        loadResharedPosts(),
        loadBookmarkedPosts(),
        checkAdmin(),
      ])
    }
  }, [user, feedView, filters])

  // Real-time subscription for new posts
  useEffect(() => {
    if (!user || feedView !== 'following' || !supabase) return

    let channel: ReturnType<typeof supabase.channel> | null = null
    let isMounted = true

    ;(async () => {
      try {
        const following = await dbService.getFollowing(user.id)
        if (!isMounted) return
        const followedIds = following.map(f => f.id)
        if (followedIds.length === 0) return

        channel = supabase
          .channel('feed_updates')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'posts',
              filter: `user_id=in.(${followedIds.join(',')})`,
            },
            () => {
              setNewPostsAvailable(true)
            }
          )
          .subscribe()
      } catch (e) {
        console.error('Failed to subscribe to feed updates', e)
        Sentry.captureException(e)
      }
    })()

    return () => {
      isMounted = false
      channel?.unsubscribe()
    }
  }, [user?.id, feedView, supabase])

  const loadLikedPosts = async () => {
    if (!user) return
    try {
      const userLikes = await dbService.getUserLikedPosts(user.id)
      setLikedPosts(new Set(userLikes.map(p => p.id)))
    } catch (error) {
      console.error('Failed to load liked posts:', error)
    }
  }

  const loadResharedPosts = async () => {
    if (!user || !supabase) return
    try {
      const { data } = await supabase.from('reshares').select('post_id').eq('user_id', user.id)
      setResharedPosts(new Set(data?.map(r => r.post_id) || []))
    } catch (error) {
      console.error('Failed to load reshared posts:', error)
    }
  }

  const loadBookmarkedPosts = async () => {
    if (!user || !supabase) return
    try {
      const { data } = await supabase.from('bookmarks').select('post_id').eq('user_id', user.id)
      setBookmarkedPosts(new Set(data?.map(b => b.post_id) || []))
    } catch (error) {
      console.error('Failed to load bookmarked posts:', error)
    }
  }

  const checkAdmin = async () => {
    if (!user || !supabase) return
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.warn('Admin check failed; defaulting to non-admin:', error)
        setIsAdmin(false)
        return
      }
      setIsAdmin(data?.is_admin === true)
    } catch (e) {
      console.warn('Admin check threw; defaulting to non-admin:', e)
      setIsAdmin(false)
    }
  }

  const loadFeedData = async (pageNum = 0) => {
    try {
      setLoading(pageNum === 0)
      setLoadingMore(pageNum > 0)
      setError(null)

      let feedPosts: Post[] = []

      if (feedView === 'following') {
        feedPosts = await loadFollowingFeed(pageNum)
      } else if (feedView === 'discover') {
        feedPosts = await loadDiscoverFeed(pageNum)
      } else if (feedView === 'trending') {
        feedPosts = await loadTrendingFeed(pageNum)
      }

      // Apply filters
      feedPosts = applyFilters(feedPosts)

      if (pageNum === 0) {
        setPosts(feedPosts)
      } else {
        setPosts(prev => [...prev, ...feedPosts])
      }

      setHasMore(feedPosts.length === 10)
      setNewPostsAvailable(false)
    } catch (error) {
      console.error('Failed to load feed:', error)
      setError('Failed to load feed. Please try again.')
      toast.error('Failed to load feed')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadFollowingFeed = async (pageNum: number) => {
    if (!user || !supabase) return []

    const following = await dbService.getFollowing(user.id)

    if (following.length > 0) {
      const followingIds = following.map(f => f.id)

      // Optimized query: filter in database, not in-memory
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .in('user_id', followingIds)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range(pageNum * 10, (pageNum + 1) * 10 - 1)

      if (error) throw error
      return data || []
    } else {
      // Show all posts for discovery
      return await dbService.getPosts({
        limit: 10,
        offset: pageNum * 10,
        published: true,
      })
    }
  }

  const loadDiscoverFeed = async (pageNum: number) => {
    if (!user || !supabase) return []

    const following = await dbService.getFollowing(user.id)
    const followingIds = following.map(f => f.id)

    // Get user's preferred genres
    const { data: userData } = await supabase
      .from('users')
      .select('preferred_genres')
      .eq('id', user.id)
      .single()

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .not('user_id', 'in', `(${followingIds.join(',')})`)
      .eq('published', true)
      .range(pageNum * 10, (pageNum + 1) * 10 - 1)

    if (error) throw error

    // Calculate engagement score for sorting
    return (data || [])
      .map(post => ({
        ...post,
        engagement_score:
          (post.likes_count || 0) * 1 +
          (post.comments_count || 0) * 2 +
          (post.reshares_count || 0) * 3,
      }))
      .sort((a, b) => b.engagement_score - a.engagement_score)
  }

  const loadTrendingFeed = async (pageNum: number) => {
    if (!supabase) return []

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .gte('created_at', yesterday)
      .range(pageNum * 10, (pageNum + 1) * 10 - 1)

    if (error) throw error

    // Calculate trending score (recent + high engagement)
    return (data || [])
      .map(post => {
        const hoursSincePost = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60)
        const recencyScore = Math.max(0, 24 - hoursSincePost) / 24
        const engagementScore =
          (post.likes_count || 0) + (post.comments_count || 0) * 2 + (post.reshares_count || 0) * 3
        return {
          ...post,
          trending_score: recencyScore * 0.3 + engagementScore * 0.7,
        }
      })
      .sort((a, b) => b.trending_score - a.trending_score)
  }

  const applyFilters = (posts: Post[]) => {
    let filtered = [...posts]

    if (filters.genres.length > 0) {
      filtered = filtered.filter(post => post.genre && filters.genres.includes(post.genre))
    }

    if (filters.moods.length > 0) {
      filtered = filtered.filter(post => post.mood && filters.moods.includes(post.mood))
    }

    if (filters.sortBy === 'popular') {
      filtered.sort((a, b) => {
        const scoreA = (a.likes_count || 0) + (a.comments_count || 0) + (a.reshares_count || 0)
        const scoreB = (b.likes_count || 0) + (b.comments_count || 0) + (b.reshares_count || 0)
        return scoreB - scoreA
      })
    }

    return filtered
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user || !supabase) return

    try {
      setCreatingPost(true)

      let imageUrl: string | undefined
      if (imageFile) {
        setUploadingImage(true)
        const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('post-images')
          .upload(path, imageFile, { cacheControl: '3600', upsert: false })
        if (upErr) {
          toast.error('Image upload failed. Please try again.')
          setImageFile(null)
          setImagePreview('')
          setUploadingImage(false)
          return
        }
        const { data } = supabase.storage.from('post-images').getPublicUrl(path)
        imageUrl = data.publicUrl
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
        setPosts(prev => [newPost, ...prev])
        setNewPostContent('')
        setNewPostExcerpt('')
        setNewPostMood('')
        setImageFile(null)
        setImagePreview('')
        toast.success('Post shared successfully!')
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      Sentry.captureException(error)
      toast.error('Failed to create post')
    } finally {
      setCreatingPost(false)
    }
  }

  const handleLikePost = async (postId: string, currentlyLiked: boolean): Promise<boolean> => {
    if (!user) return currentlyLiked

    try {
      const newLikedState = await dbService.toggleLike(postId, user.id)

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
      Sentry.captureException(error)
      toast.error('Failed to update like')
      return currentlyLiked
    }
  }

  const handleResharePost = async (postId: string, comment?: string): Promise<boolean> => {
    if (!user || !supabase) return false

    try {
      const isReshared = resharedPosts.has(postId)

      if (isReshared) {
        await supabase.from('reshares').delete().eq('post_id', postId).eq('user_id', user.id)

        setResharedPosts(prev => {
          const updated = new Set(prev)
          updated.delete(postId)
          return updated
        })

        setPosts(prev =>
          prev.map(p =>
            p.id === postId ? { ...p, reshares_count: Math.max(0, (p.reshares_count || 0) - 1) } : p
          )
        )

        toast.success('Reshare removed')
        return false
      } else {
        await supabase.from('reshares').insert({
          post_id: postId,
          user_id: user.id,
          comment: comment || null,
        })

        setResharedPosts(prev => new Set([...prev, postId]))

        setPosts(prev =>
          prev.map(p =>
            p.id === postId ? { ...p, reshares_count: (p.reshares_count || 0) + 1 } : p
          )
        )

        toast.success('Post reshared!')
        return true
      }
    } catch (error) {
      console.error('Failed to toggle reshare:', error)
      Sentry.captureException(error)
      toast.error('Failed to reshare post')
      return false
    }
  }

  const handleBookmarkPost = async (postId: string): Promise<boolean> => {
    if (!user || !supabase) return false

    try {
      const isBookmarked = bookmarkedPosts.has(postId)

      if (isBookmarked) {
        await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', user.id)

        setBookmarkedPosts(prev => {
          const updated = new Set(prev)
          updated.delete(postId)
          return updated
        })

        toast.success('Bookmark removed')
        return false
      } else {
        await supabase.from('bookmarks').insert({
          post_id: postId,
          user_id: user.id,
        })

        setBookmarkedPosts(prev => new Set([...prev, postId]))
        toast.success('Post bookmarked!')
        return true
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
      Sentry.captureException(error)
      toast.error('Failed to bookmark post')
      return false
    }
  }

  const handleCommentPost = (postId: string) => {
    // Scroll to comments section
    toast('Scroll down to comment!')
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
      Sentry.captureException(error)
    }
  }

  const toggleGenreFilter = (genre: string) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre],
    }))
  }

  const toggleMoodFilter = (mood: string) => {
    setFilters(prev => ({
      ...prev,
      moods: prev.moods.includes(mood) ? prev.moods.filter(m => m !== mood) : [...prev.moods, mood],
    }))
  }

  const loadNewPosts = () => {
    setPage(0)
    loadFeedData(0)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {/* Header with Feed Tabs */}
          <div className="space-y-4">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-center">Your Feed</h1>

            <Tabs value={feedView} onValueChange={v => setFeedView(v as FeedView)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="following">
                  <Users className="h-4 w-4 mr-2" />
                  Following
                </TabsTrigger>
                <TabsTrigger value="discover">
                  <Compass className="h-4 w-4 mr-2" />
                  Discover
                </TabsTrigger>
                <TabsTrigger value="trending">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trending
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filters */}
            <div className="flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {filters.genres.length + filters.moods.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {filters.genres.length + filters.moods.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Genres</DropdownMenuLabel>
                  {availableGenres.map(genre => (
                    <DropdownMenuCheckboxItem
                      key={genre}
                      checked={filters.genres.includes(genre)}
                      onCheckedChange={() => toggleGenreFilter(genre)}
                    >
                      {genre}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Moods</DropdownMenuLabel>
                  {availableMoods.map(mood => (
                    <DropdownMenuCheckboxItem
                      key={mood}
                      checked={filters.moods.includes(mood)}
                      onCheckedChange={() => toggleMoodFilter(mood)}
                    >
                      {mood.replace('_', ' ')}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center space-x-2">
                <Button
                  variant={filters.sortBy === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, sortBy: 'recent' }))}
                >
                  Recent
                </Button>
                <Button
                  variant={filters.sortBy === 'popular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, sortBy: 'popular' }))}
                >
                  Popular
                </Button>
              </div>
            </div>
          </div>

          {/* New Posts Banner */}
          {newPostsAvailable && (
            <Card className="bg-primary/10 border-primary">
              <CardContent className="p-4 text-center">
                <Button onClick={loadNewPosts} variant="default">
                  ↑ New posts available - Click to refresh
                </Button>
              </CardContent>
            </Card>
          )}

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
                  <div className="relative">
                    <Textarea
                      value={newPostContent}
                      onChange={e => setNewPostContent(e.target.value)}
                      placeholder="Share your writing journey, an excerpt, or start a discussion... (Ctrl+Enter to post)"
                      className="min-h-[80px] sm:min-h-[100px] resize-none border-literary-border text-sm sm:text-base"
                      disabled={creatingPost}
                      maxLength={MAX_CONTENT_LENGTH}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                      {newPostContent.length}/{MAX_CONTENT_LENGTH}
                    </div>
                  </div>

                  <Textarea
                    value={newPostExcerpt}
                    onChange={e => setNewPostExcerpt(e.target.value)}
                    placeholder="Optional: add an excerpt to highlight (renders as blockquote)"
                    className="min-h-[60px] resize-none border-literary-border text-xs sm:text-sm"
                    disabled={creatingPost}
                  />

                  {imagePreview && (
                    <div className="rounded-md border border-literary-border overflow-hidden relative">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={800}
                        height={256}
                        className="max-h-64 w-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview('')
                          const input = document.getElementById(
                            'post-image-input'
                          ) as HTMLInputElement
                          if (input) input.value = ''
                        }}
                      >
                        Remove
                      </Button>
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
                          if (!allowed.includes(file.type)) {
                            toast.error('Unsupported image type. Use JPG, PNG, or WebP')
                            ;(e.target as HTMLInputElement).value = ''
                            return
                          }
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('Image too large. Max size is 5MB')
                            ;(e.target as HTMLInputElement).value = ''
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

          {/* Error State */}
          {error && (
            <Card className="card-bg border-destructive">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <p className="text-destructive font-medium">{error}</p>
                  <Button onClick={() => loadFeedData(0)} variant="outline">
                    <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts Feed */}
          <div className="space-y-3 sm:space-y-4">
            {!error && loading ? (
              <>
                {[1, 2, 3].map(i => (
                  <Card key={i} className="card-bg card-shadow border-literary-border">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-20 w-full" />
                          <div className="flex gap-4">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : posts.length > 0 ? (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  postId={post.id}
                  author={post.display_name || post.username || 'Unknown Author'}
                  authorId={post.user_id}
                  currentUserId={user?.id}
                  isAdmin={isAdmin}
                  avatar={post.avatar_url}
                  time={new Date(post.created_at).toLocaleDateString()}
                  content={post.content}
                  excerpt={post.excerpt}
                  imageUrl={post.image_url}
                  mood={post.mood}
                  type="discussion"
                  likes={post.likes_count || 0}
                  comments={post.comments_count || 0}
                  reshares={post.reshares_count || 0}
                  isLiked={likedPosts.has(post.id)}
                  isReshared={resharedPosts.has(post.id)}
                  isBookmarked={bookmarkedPosts.has(post.id)}
                  onLike={handleLikePost}
                  onComment={handleCommentPost}
                  onShare={handleSharePost}
                  onReshare={handleResharePost}
                  onBookmark={handleBookmarkPost}
                  onDelete={postId => setPosts(prev => prev.filter(p => p.id !== postId))}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No posts in your feed yet.</p>
                <div className="space-y-2">
                  {feedView === 'following' ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        <Link href="/authors" className="text-primary hover:underline">
                          Follow some writers
                        </Link>{' '}
                        to see their posts here.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Or switch to{' '}
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() => setFeedView('discover')}
                        >
                          Discover
                        </Button>{' '}
                        to explore new content.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters or check back later.
                    </p>
                  )}
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
                onClick={() => {
                  const nextPage = page + 1
                  setPage(nextPage)
                  loadFeedData(nextPage)
                }}
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
  )
}
