'use client'

import { Navigation } from '@/src/components/navigation'
import { PostCard } from '@/src/components/post-card'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { Textarea } from '@/src/components/ui/textarea'
import { Skeleton } from '@/src/components/ui/skeleton'
import {
  MapPin,
  Calendar,
  Link as LinkIcon,
  MessageCircle,
  UserPlus,
  UserMinus,
  MoreHorizontal,
  PenTool,
  Image as ImageIcon,
  Smile,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/src/contexts/auth-context'
import { dbService } from '@/src/lib/database'
import type { User, Post } from '@/src/lib/supabase'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function Profile() {
  const params = useParams()
  const username = params.username as string
  const { user: currentUser } = useAuth()

  // State management
  const [profile, setProfile] = useState<User | null>(null)
  const [userStats, setUserStats] = useState({
    posts_count: 0,
    followers_count: 0,
    following_count: 0,
  })
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [newPostContent, setNewPostContent] = useState('')
  const [creatingPost, setCreatingPost] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Post[]>([])
  const [resharedPosts, setResharedPosts] = useState<Post[]>([])
  const [loadingLikes, setLoadingLikes] = useState(false)
  const [loadingReshares, setLoadingReshares] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)

  // Load profile data on mount
  useEffect(() => {
    if (username) {
      loadProfile()
    }
  }, [username])

  // Check if current user is following this profile
  useEffect(() => {
    if (currentUser?.profile && profile && currentUser.profile.id !== profile.id) {
      checkFollowStatus()
    }
  }, [currentUser, profile])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Phase 1: Load user by username
      const userData = await dbService.getUserByUsernameLegacy(username)
      if (!userData) {
        setError('User not found')
        return
      }

      setProfile(userData)

      // Phase 2: Load remaining data in parallel for better performance
      const [stats, posts] = await Promise.all([
        dbService.getUserStats(userData.id),
        dbService.getPosts({
          userId: userData.id,
          published: true,
          limit: 20,
        }),
      ])

      setUserStats(stats)
      setUserPosts(posts)
      setCurrentOffset(20)
      setHasMore(posts.length === 20)
    } catch (error) {
      console.error('Failed to load profile:', error)
      setError('Failed to load profile')
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const checkFollowStatus = async () => {
    if (!currentUser?.profile || !profile) return

    try {
      const following = await dbService.isFollowing(currentUser.profile.id, profile.id)
      setIsFollowing(following)
    } catch (error) {
      console.error('Failed to check follow status:', error)
    }
  }

  const handleFollow = async () => {
    if (!currentUser?.profile || !profile || currentUser.profile.id === profile.id) return

    try {
      setFollowLoading(true)
      const nowFollowing = await dbService.toggleFollow(currentUser.profile.id, profile.id)
      setIsFollowing(nowFollowing)

      // Update followers count
      setUserStats(prev => ({
        ...prev,
        followers_count: nowFollowing ? prev.followers_count + 1 : prev.followers_count - 1,
      }))

      toast.success(nowFollowing ? 'Following user' : 'Unfollowed user')
    } catch (error) {
      console.error('Failed to toggle follow:', error)
      toast.error('Failed to update follow status')
    } finally {
      setFollowLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!currentUser?.profile || !newPostContent.trim()) return

    try {
      setCreatingPost(true)
      const post = await dbService.createPost({
        user_id: currentUser.profile.id,
        title: 'Post', // You might want to extract title from content or make it optional
        content: newPostContent.trim(),
        published: true,
      })

      if (post) {
        // If viewing own profile, add the new post to the list
        if (profile?.id === currentUser.profile.id) {
          setUserPosts(prev => [post, ...prev])
          setUserStats(prev => ({
            ...prev,
            posts_count: prev.posts_count + 1,
          }))
        }
        setNewPostContent('')
        toast.success('Post created successfully!')
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error('Failed to create post')
    } finally {
      setCreatingPost(false)
    }
  }

  const isOwnProfile = currentUser?.profile?.id === profile?.id

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header Skeleton */}
            <Card className="card-bg card-shadow border-literary-border mb-8">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col items-center sm:items-start">
                    <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                    <div className="flex gap-4">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {error === 'User not found' ? 'User Not Found' : 'Error Loading Profile'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {error === 'User not found'
                  ? "The user you're looking for doesn't exist or may have been deactivated."
                  : "We couldn't load this profile. Please try again later."}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => window.history.back()}>
                  Go Back
                </Button>
                {error !== 'User not found' && (
                  <Button onClick={() => loadProfile()}>
                    <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getPostsForTab = () => {
    switch (activeTab) {
      case 'posts':
        return userPosts
      case 'likes':
        return likedPosts
      case 'reshares':
        return resharedPosts
      default:
        return userPosts
    }
  }

  const loadLikedPosts = async () => {
    if (!profile?.id || loadingLikes) return

    try {
      setLoadingLikes(true)
      const posts = await dbService.getUserLikedPosts(profile.id)
      setLikedPosts(posts)
    } catch (error) {
      console.error('Failed to load liked posts:', error)
      toast.error('Failed to load liked posts')
    } finally {
      setLoadingLikes(false)
    }
  }

  const loadResharedPosts = async () => {
    if (!profile?.id || loadingReshares) return

    try {
      setLoadingReshares(true)
      const posts = await dbService.getUserResharedPosts(profile.id)
      setResharedPosts(posts)
    } catch (error) {
      console.error('Failed to load reshared posts:', error)
      toast.error('Failed to load reshared posts')
    } finally {
      setLoadingReshares(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)

    // Load data for the selected tab if not already loaded
    if (tab === 'likes' && likedPosts.length === 0) {
      loadLikedPosts()
    } else if (tab === 'reshares' && resharedPosts.length === 0) {
      loadResharedPosts()
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore || !profile?.id) return

    try {
      setLoadingMore(true)

      // Load more posts based on current tab
      if (activeTab === 'posts') {
        // Get more user posts starting from current offset
        const morePosts = await dbService.getPosts({
          userId: profile.id,
          published: true,
          limit: 20,
          offset: currentOffset,
        })

        if (morePosts.length === 0) {
          setHasMore(false)
          return
        }

        // Append to existing posts
        setUserPosts(prev => [...prev, ...morePosts])
        setCurrentOffset(prev => prev + morePosts.length)

        // Check if we have more
        if (morePosts.length < 20) {
          setHasMore(false)
        }

        toast.success(`Loaded ${morePosts.length} more posts`)
      } else {
        // For likes and reshares tabs, we don't have pagination yet
        toast('Pagination not available for this tab yet')
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more content:', error)
      toast.error('Failed to load more content')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="card-bg card-shadow border-literary-border mb-8">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col space-y-6">
                {/* Mobile-first: Avatar and buttons on top */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                  <div className="flex flex-col items-center sm:items-start">
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 mb-4">
                      <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                      <AvatarFallback className="bg-literary-subtle text-foreground font-bold text-xl sm:text-2xl">
                        {profile.display_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      {!isOwnProfile && (
                        <>
                          <Button
                            variant={isFollowing ? 'outline' : 'default'}
                            size="sm"
                            onClick={handleFollow}
                            disabled={followLoading}
                            className="flex items-center space-x-2"
                          >
                            {followLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isFollowing ? (
                              <UserMinus className="h-4 w-4" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                            <span>{isFollowing ? 'Following' : 'Follow'}</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-2"
                            asChild
                          >
                            <Link href="/messages">
                              <MessageCircle className="h-4 w-4" />
                              <span className="hidden xs:inline">Message</span>
                            </Link>
                          </Button>
                        </>
                      )}

                      <Button variant="ghost" size="sm" className="p-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 text-center sm:text-left">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold break-words">
                          {profile.display_name}
                        </h1>
                      </div>
                      <p className="text-muted-foreground text-base sm:text-lg">
                        @{profile.username}
                      </p>
                      {profile.specialty && (
                        <p className="text-sm text-literary-accent font-medium mb-2">
                          {profile.specialty}
                        </p>
                      )}
                    </div>

                    {profile.bio && (
                      <p className="text-foreground leading-relaxed text-sm sm:text-base">
                        {profile.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span>
                          Joined{' '}
                          {new Date(profile.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 sm:gap-6 text-sm justify-center sm:justify-start">
                      <div className="text-center sm:text-left">
                        <span className="font-semibold text-foreground">
                          {userStats.following_count.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground ml-1">Following</span>
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="font-semibold text-foreground">
                          {userStats.followers_count.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground ml-1">Followers</span>
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="font-semibold text-foreground">
                          {userStats.posts_count}
                        </span>
                        <span className="text-muted-foreground ml-1">Posts</span>
                      </div>
                    </div>

                    {profile.specialty && (
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <Badge variant="secondary" className="text-xs">
                          {profile.specialty}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Post Section - Only show for own profile */}
          {isOwnProfile && (
            <Card className="card-bg card-shadow border-literary-border mb-6">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarImage
                      src={currentUser?.profile?.avatar_url}
                      alt={currentUser?.profile?.display_name}
                    />
                    <AvatarFallback className="bg-literary-subtle text-foreground font-medium text-xs sm:text-sm">
                      {currentUser?.profile?.display_name
                        ?.split(' ')
                        .map(n => n[0])
                        .join('') || 'You'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                    <Textarea
                      value={newPostContent}
                      onChange={e => setNewPostContent(e.target.value)}
                      placeholder="Share your latest work, thoughts, or connect with the community..."
                      className="min-h-[60px] sm:min-h-[80px] resize-none border-literary-border text-sm sm:text-base"
                      disabled={creatingPost}
                    />

                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs sm:h-8 sm:text-sm whitespace-nowrap"
                          disabled
                        >
                          <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span>Image</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs sm:h-8 sm:text-sm whitespace-nowrap"
                          disabled
                        >
                          <PenTool className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span>Excerpt</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs sm:h-8 sm:text-sm whitespace-nowrap"
                          disabled
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
                            <span>Posting...</span>
                          </>
                        ) : (
                          <span>Post</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs Section */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-4 sm:space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger
                value="posts"
                className="flex flex-col xs:flex-row xs:items-center xs:space-x-2 p-2 sm:p-3"
              >
                <span className="text-xs sm:text-sm">Posts</span>
                <Badge variant="secondary" className="text-xs mt-1 xs:mt-0">
                  {userPosts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="likes"
                className="flex flex-col xs:flex-row xs:items-center xs:space-x-2 p-2 sm:p-3"
              >
                <span className="text-xs sm:text-sm">Liked</span>
                <Badge variant="secondary" className="text-xs mt-1 xs:mt-0">
                  {likedPosts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="reshares"
                className="flex flex-col xs:flex-row xs:items-center xs:space-x-2 p-2 sm:p-3"
              >
                <span className="text-xs sm:text-sm">Reshared</span>
                <Badge variant="secondary" className="text-xs mt-1 xs:mt-0">
                  {resharedPosts.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              {userPosts.length > 0 ? (
                userPosts.map(post => (
                  <PostCard
                    key={post.id}
                    author={post.user?.display_name || profile?.display_name || 'Unknown'}
                    avatar={post.user?.avatar_url || profile?.avatar_url}
                    time={new Date(post.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    content={post.content}
                    type="discussion"
                    likes={post.likes_count || 0}
                    comments={post.comments_count || 0}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "You haven't posted anything yet" : 'No posts yet'}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="likes" className="space-y-4">
              <div className="text-center py-12">
                {loadingLikes ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading liked posts...</p>
                  </>
                ) : likedPosts.length > 0 ? (
                  <div className="space-y-4">
                    {likedPosts.map(post => (
                      <PostCard
                        key={post.id}
                        author={post.user?.display_name || post.user?.username || 'Unknown'}
                        avatar={post.user?.avatar_url}
                        time={new Date(post.created_at).toLocaleDateString()}
                        content={post.content}
                        type={(post as any).type || 'discussion'}
                        excerpt={post.excerpt}
                        imageUrl={post.image_url}
                        mood={post.mood}
                        likes={post.likes_count || 0}
                        comments={post.comments_count || 0}
                        reshares={0}
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No liked posts yet</p>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reshares" className="space-y-4">
              <div className="text-center py-12">
                {loadingReshares ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading reshared posts...</p>
                  </>
                ) : resharedPosts.length > 0 ? (
                  <div className="space-y-4">
                    {resharedPosts.map(post => (
                      <PostCard
                        key={post.id}
                        author={post.user?.display_name || post.user?.username || 'Unknown'}
                        avatar={post.user?.avatar_url}
                        time={new Date(post.created_at).toLocaleDateString()}
                        content={post.content}
                        type={(post as any).type || 'discussion'}
                        excerpt={post.excerpt}
                        imageUrl={post.image_url}
                        mood={post.mood}
                        likes={post.likes_count || 0}
                        comments={post.comments_count || 0}
                        reshares={0}
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No reshared posts yet</p>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-8">
              <Button variant="outline" size="lg" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading More...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
