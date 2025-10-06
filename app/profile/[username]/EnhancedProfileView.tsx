'use client'

import { Navigation } from '@/src/components/navigation'
import { PostCard } from '@/src/components/post-card'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { Textarea } from '@/src/components/ui/textarea'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Separator } from '@/src/components/ui/separator'
import { Progress } from '@/src/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
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
  Briefcase,
  DollarSign,
  Star,
  CheckCircle,
  Shield,
  Award,
  TrendingUp,
  Clock,
  Globe,
  Twitter,
  Linkedin,
  Share2,
  Download,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Send,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/auth-context'
import { dbService } from '@/src/lib/database'
import type { User, Post } from '@/src/lib/supabase'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Review {
  id: string
  rating: number
  review_text: string
  communication_rating?: number
  quality_rating?: number
  professionalism_rating?: number
  timeliness_rating?: number
  reviewer: {
    display_name: string
    avatar_url?: string
  }
  created_at: string
}

export default function EnhancedProfileView() {
  const params = useParams()
  const router = useRouter()
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
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [expandedBio, setExpandedBio] = useState(false)

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

      const userData = await dbService.getUserByUsernameLegacy(username)
      if (!userData) {
        setError('User not found')
        return
      }

      const privacySettings = await dbService.getPrivacySettings(userData.id)
      const isOwnProfile = currentUser?.profile?.id === userData.id
      const isFollowing = currentUser?.profile
        ? await dbService.isFollowing(currentUser.profile.id, userData.id)
        : false

      if (privacySettings && !isOwnProfile) {
        if (privacySettings.profile_visibility === 'private') {
          setError('This profile is private')
          toast.error('This profile is private')
          return
        }
        if (privacySettings.profile_visibility === 'followers_only' && !isFollowing) {
          setError('This profile is only visible to followers')
          toast.error('This profile is only visible to followers')
          return
        }
      }

      setProfile(userData)

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
        title: 'Post',
        content: newPostContent.trim(),
        published: true,
      })

      if (post) {
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

  const loadReviews = async () => {
    if (!profile?.id || loadingReviews) return

    try {
      setLoadingReviews(true)
      const response = await fetch(`/api/reviews/user/${profile.id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Failed to load reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)

    if (tab === 'likes' && likedPosts.length === 0) {
      loadLikedPosts()
    } else if (tab === 'reshares' && resharedPosts.length === 0) {
      loadResharedPosts()
    } else if (tab === 'reviews' && reviews.length === 0) {
      loadReviews()
    }
  }

  const handleHireClick = () => {
    router.push(`/opportunities?writer=${profile?.username}`)
  }

  const handleRequestQuote = () => {
    router.push(`/messages?to=${profile?.username}&action=quote`)
  }

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/profile/${username}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.display_name} - Professional Writer`,
          text: profile?.bio || '',
          url,
        })
      } catch (error) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Profile link copied to clipboard!')
    }
  }

  const isOwnProfile = currentUser?.profile?.id === profile?.id
  const isWriter = profile?.account_type === 'writer'
  const hasReviews = reviews.length > 0
  const hasRating = reviews.length > 0

  // Calculate average rating from reviews
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Skeleton className="h-32 w-32 rounded-full" />
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-16 w-full" />
                    <div className="flex gap-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  ? "The user you're looking for doesn't exist."
                  : "We couldn't load this profile."}
              </p>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Pricing display removed - pricing fields not in User type
  const pricingDisplay = null

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Profile Header */}
          <Card className="card-bg card-shadow border-literary-border mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center sm:items-start">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                    <AvatarFallback className="bg-literary-subtle text-2xl font-bold">
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
                        >
                          {followLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isFollowing ? (
                            <>
                              <UserMinus className="h-4 w-4 mr-2" />
                              Following
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Follow
                            </>
                          )}
                        </Button>

                        <Button variant="outline" size="sm" asChild>
                          <Link href="/messages">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Link>
                        </Button>
                      </>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleShareProfile}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Profile
                        </DropdownMenuItem>
                        {!isOwnProfile && (
                          <>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Save Contact
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Report Profile
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="font-serif text-3xl font-bold">{profile.display_name}</h1>
                      {profile.verification_status === 'verified' && (
                        <Badge className="bg-blue-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {profile.stripe_connect_onboarded && (
                        <Badge variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          Payment Verified
                        </Badge>
                      )}
                      {reviews.length > 50 && (
                        <Badge variant="secondary">
                          <Award className="h-3 w-3 mr-1" />
                          Top Rated
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-lg">@{profile.username}</p>
                    {profile.specialty && (
                      <p className="text-literary-accent font-medium mt-1">{profile.specialty}</p>
                    )}
                  </div>

                  {profile.bio && (
                    <div>
                      <p
                        className={`text-foreground leading-relaxed ${!expandedBio && (profile.bio || '').length > 200 ? 'line-clamp-3' : ''}`}
                      >
                        {profile.bio}
                      </p>
                      {(profile.bio || '').length > 200 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="px-0"
                          onClick={() => setExpandedBio(!expandedBio)}
                        >
                          {expandedBio ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Read more
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {profile.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {profile.location}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Joined{' '}
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </div>
                  </div>

                  {/* Social Links */}
                  {(profile.website_url || profile.twitter_handle || profile.linkedin_url) && (
                    <div className="flex flex-wrap gap-2">
                      {profile.website_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-4 w-4 mr-2" />
                            Website
                          </a>
                        </Button>
                      )}
                      {profile.twitter_handle && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`https://twitter.com/${profile.twitter_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Twitter className="h-4 w-4 mr-2" />
                            Twitter
                          </a>
                        </Button>
                      )}
                      {profile.linkedin_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4 mr-2" />
                            LinkedIn
                          </a>
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="font-semibold">
                        {userStats.following_count.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground ml-1">Following</span>
                    </div>
                    <div>
                      <span className="font-semibold">
                        {userStats.followers_count.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground ml-1">Followers</span>
                    </div>
                    <div>
                      <span className="font-semibold">{userStats.posts_count}</span>
                      <span className="text-muted-foreground ml-1">Posts</span>
                    </div>
                  </div>

                  {/* Specializations/Genres */}
                  {profile.preferred_genres && profile.preferred_genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.preferred_genres.map((genre: string) => (
                        <Badge key={genre} variant="secondary">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Info Card - Writers Only */}
          {isWriter && !isOwnProfile && (
            <Card className="border-primary/20 bg-primary/5 mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Pricing - not available in User type */}

                  {/* Rating */}
                  {hasRating && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Rating</h3>
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({reviews.length} reviews)</span>
                      </div>
                    </div>
                  )}

                  {/* Jobs Completed */}
                  {reviews.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                        Experience
                      </h3>
                      <p className="text-2xl font-bold">{reviews.length}</p>
                      <p className="text-sm text-muted-foreground">Jobs completed</p>
                    </div>
                  )}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" onClick={handleHireClick} className="flex-1 sm:flex-none">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Hire Me
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleRequestQuote}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Request Quote
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/messages">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Link>
                  </Button>
                </div>

                {/* Professional Stats - removed (fields not in User type) */}
              </CardContent>
            </Card>
          )}

          {/* Create Post Section - Own Profile */}
          {isOwnProfile && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser?.profile?.avatar_url} />
                    <AvatarFallback>
                      {currentUser?.profile?.display_name
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-4">
                    <Textarea
                      value={newPostContent}
                      onChange={e => setNewPostContent(e.target.value)}
                      placeholder="Share your latest work, thoughts, or connect with the community..."
                      className="min-h-[80px] resize-none"
                      disabled={creatingPost}
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="sm" disabled>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Image
                        </Button>
                        <Button variant="ghost" size="sm" disabled>
                          <PenTool className="h-4 w-4 mr-2" />
                          Excerpt
                        </Button>
                      </div>

                      <Button
                        onClick={handleCreatePost}
                        disabled={!newPostContent.trim() || creatingPost}
                      >
                        {creatingPost ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          'Post'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs Section */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posts">
                Posts
                <Badge variant="secondary" className="ml-2">
                  {userPosts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews
                <Badge variant="secondary" className="ml-2">
                  {reviews.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="likes">
                Liked
                <Badge variant="secondary" className="ml-2">
                  {likedPosts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            </TabsList>

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-4">
              {userPosts.length > 0 ? (
                userPosts.map(post => (
                  <PostCard
                    key={post.id}
                    author={post.user?.display_name || profile?.display_name || 'Unknown'}
                    avatar={post.user?.avatar_url || profile?.avatar_url}
                    time={new Date(post.created_at).toLocaleDateString()}
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

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              {loadingReviews ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading reviews...</p>
                </div>
              ) : hasReviews ? (
                <>
                  {/* Rating Overview */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="text-center md:text-left">
                          <p className="text-5xl font-bold mb-2">{averageRating.toFixed(1)}</p>
                          <div className="flex justify-center md:justify-start mb-2">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${i <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Based on {reviews.length} reviews
                          </p>
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm w-12">5 stars</span>
                            <Progress value={85} className="flex-1" />
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              85%
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm w-12">4 stars</span>
                            <Progress value={12} className="flex-1" />
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              12%
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm w-12">3 stars</span>
                            <Progress value={2} className="flex-1" />
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              2%
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm w-12">2 stars</span>
                            <Progress value={1} className="flex-1" />
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              1%
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm w-12">1 star</span>
                            <Progress value={0} className="flex-1" />
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              0%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Individual Reviews */}
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <Card key={review.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage src={review.reviewer.avatar_url} />
                              <AvatarFallback>{review.reviewer.display_name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-semibold">{review.reviewer.display_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map(i => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${i <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-foreground mb-3">{review.review_text}</p>
                              {review.communication_rating && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Communication</p>
                                    <p className="font-semibold">{review.communication_rating}/5</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Quality</p>
                                    <p className="font-semibold">{review.quality_rating}/5</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Professionalism</p>
                                    <p className="font-semibold">
                                      {review.professionalism_rating}/5
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Timeliness</p>
                                    <p className="font-semibold">{review.timeliness_rating}/5</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No reviews yet</p>
                </div>
              )}
            </TabsContent>

            {/* Likes Tab */}
            <TabsContent value="likes" className="space-y-4">
              {loadingLikes ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading liked posts...</p>
                </div>
              ) : likedPosts.length > 0 ? (
                likedPosts.map(post => (
                  <PostCard
                    key={post.id}
                    author={post.user?.display_name || 'Unknown'}
                    avatar={post.user?.avatar_url}
                    time={new Date(post.created_at).toLocaleDateString()}
                    content={post.content}
                    type="discussion"
                    likes={post.likes_count || 0}
                    comments={post.comments_count || 0}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No liked posts yet</p>
                </div>
              )}
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="space-y-6">
              {profile.website_url ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio</CardTitle>
                    <CardDescription>
                      View my complete portfolio and writing samples
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild>
                      <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Portfolio
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {isOwnProfile ? 'Add a portfolio URL in settings' : 'No portfolio available'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
