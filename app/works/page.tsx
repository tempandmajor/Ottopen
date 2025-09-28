'use client'

import { Navigation } from '@/src/components/navigation'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Search, Filter, BookOpen, Star, Eye, Heart, Calendar, User, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { dbService } from '@/src/lib/database'
import type { Post } from '@/src/lib/supabase'
import { toast } from 'react-hot-toast'

export default function Works() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Post[]>([])
  const [searching, setSearching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [worksStats, setWorksStats] = useState({
    total: 0,
    newThisWeek: 0,
    totalReads: 0,
    totalLikes: 0,
  })

  // Load posts on mount
  useEffect(() => {
    loadPosts()
  }, [])

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const allPosts = await dbService.getPosts({ limit: 20, published: true })
      setPosts(allPosts)
      setCurrentOffset(20)
      setHasMore(allPosts.length === 20)
      setWorksStats({
        total: allPosts.length,
        newThisWeek: allPosts.filter(
          p => new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        totalReads: allPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0), // Using likes as reads proxy
        totalLikes: allPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0),
      })
    } catch (error) {
      console.error('Failed to load posts:', error)
      toast.error('Failed to load works')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setSearching(true)
      const results = await dbService.searchPosts(searchQuery, 20)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)

      // Get more posts starting from current offset
      const morePosts = await dbService.getPosts({
        limit: 20,
        published: true,
        offset: currentOffset,
      })

      if (morePosts.length === 0) {
        setHasMore(false)
        return
      }

      // Append to existing posts
      setPosts(prev => [...prev, ...morePosts])
      setCurrentOffset(prev => prev + morePosts.length)

      // Check if we have more
      if (morePosts.length < 20) {
        setHasMore(false)
      }

      toast.success(`Loaded ${morePosts.length} more works`)
    } catch (error) {
      console.error('Failed to load more works:', error)
      toast.error('Failed to load more works')
    } finally {
      setLoadingMore(false)
    }
  }

  const filteredPosts = searchQuery.trim() ? searchResults : posts
  const featuredWorks = filteredPosts.slice(0, 6)
  const newReleases = filteredPosts.filter(
    post => new Date(post.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  )
  const popular = [...filteredPosts]
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 4)
  const trending = [...filteredPosts]
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 4)

  // Create WorkCard component for real posts
  const WorkCard = ({ post }: { post: Post }) => (
    <Card className="card-bg card-shadow border-literary-border hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
            <BookOpen className="h-8 w-8" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="font-serif text-lg sm:text-xl font-semibold mb-1 truncate">
                  {post.title}
                </h3>
                <Link
                  href={`/profile/${post.user?.username || 'unknown'}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  by {post.user?.display_name || 'Unknown Author'}
                </Link>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Badge variant={post.published ? 'default' : 'secondary'}>
                  {post.published ? 'Published' : 'Draft'}
                </Badge>
                <Badge variant="outline">Article</Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {post.excerpt || post.content?.substring(0, 150) + '...'}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                })}
              </div>
              <div className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                {post.user?.display_name || 'Unknown'}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>{(post.likes_count || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  <span>{post.likes_count || 0}</span>
                </div>
                <div className="flex items-center">
                  <span>{post.comments_count || 0} comments</span>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/posts/${post.id}`}>Read</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const genres = [
    'Literary Fiction',
    'Mystery & Thriller',
    'Romance',
    'Science Fiction',
    'Fantasy',
    'Poetry',
    'Non-Fiction',
    'Young Adult',
    'Historical Fiction',
    'Horror',
    'Drama',
    'Comedy',
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">Literary Works</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore novels, short stories, poetry, and plays from our community of writers.
              Discover your next great read.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8">
            <Card className="card-bg card-shadow border-literary-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search works by title, author, or genre..."
                      className="pl-10 border-literary-border"
                    />
                  </div>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </Button>
                </div>

                {/* Genre Tags */}
                <div className="mt-4 pt-4 border-t border-literary-border">
                  <p className="text-sm font-medium mb-3">Browse by Genre</p>
                  <div className="flex flex-wrap gap-2">
                    {genres.map(genre => (
                      <Badge
                        key={genre}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="card-bg border-literary-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      worksStats.total.toLocaleString()
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Total Works</p>
              </CardContent>
            </Card>
            <Card className="card-bg border-literary-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      worksStats.newThisWeek
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">New This Week</p>
              </CardContent>
            </Card>
            <Card className="card-bg border-literary-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      worksStats.totalReads.toLocaleString()
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Total Reads</p>
              </CardContent>
            </Card>
            <Card className="card-bg border-literary-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      worksStats.totalLikes.toLocaleString()
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Total Likes</p>
              </CardContent>
            </Card>
          </div>

          {/* Works Tabs */}
          <Tabs defaultValue="featured" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1">
              <TabsTrigger value="featured" className="p-3">
                <span className="text-sm">Featured</span>
              </TabsTrigger>
              <TabsTrigger value="new" className="p-3">
                <span className="text-sm">New Releases</span>
              </TabsTrigger>
              <TabsTrigger value="popular" className="p-3">
                <span className="text-sm">Popular</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="p-3">
                <span className="text-sm">Trending</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="featured" className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading works...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {featuredWorks.length > 0 ? (
                    featuredWorks.map(post => <WorkCard key={post.id} post={post} />)
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No featured works found</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="new" className="space-y-6">
              <div className="space-y-4">
                {newReleases.length > 0 ? (
                  newReleases.map(post => <WorkCard key={post.id} post={post} />)
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No new releases found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="popular" className="space-y-6">
              <div className="space-y-4">
                {popular.length > 0 ? (
                  popular.map(post => <WorkCard key={post.id} post={post} />)
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No popular works found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="trending" className="space-y-6">
              <div className="space-y-4">
                {trending.length > 0 ? (
                  trending.map(post => <WorkCard key={post.id} post={post} />)
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No trending works found</p>
                  </div>
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
                    Loading More Works...
                  </>
                ) : (
                  'Load More Works'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
