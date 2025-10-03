'use client'

import { Navigation } from '@/src/components/navigation'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { Label } from '@/src/components/ui/label'
import {
  Search,
  Filter,
  BookOpen,
  Star,
  Eye,
  Heart,
  Calendar,
  User,
  Loader2,
  Flame,
  Sparkles,
  Clock,
  X,
} from 'lucide-react'
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
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [filters, setFilters] = useState({
    contentTypes: [] as string[],
    readingTime: null as string | null,
    completionStatus: [] as string[],
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

  // Apply all filters
  const applyFilters = (postList: Post[]) => {
    let filtered = [...postList]

    // Genre filter
    if (selectedGenre) {
      filtered = filtered.filter(p => p.genre === selectedGenre)
    }

    // Content type filter
    if (filters.contentTypes.length > 0) {
      filtered = filtered.filter(
        p => p.content_type && filters.contentTypes.includes(p.content_type)
      )
    }

    // Reading time filter
    if (filters.readingTime) {
      filtered = filtered.filter(p => {
        const time = p.reading_time_minutes || 0
        switch (filters.readingTime) {
          case '0-5':
            return time <= 5
          case '5-10':
            return time > 5 && time <= 10
          case '10-30':
            return time > 10 && time <= 30
          case '30+':
            return time > 30
          default:
            return true
        }
      })
    }

    // Completion status filter
    if (filters.completionStatus.length > 0) {
      filtered = filtered.filter(
        p => p.completion_status && filters.completionStatus.includes(p.completion_status)
      )
    }

    return filtered
  }

  const filteredPosts = applyFilters(searchQuery.trim() ? searchResults : posts)
  const featuredWorks = filteredPosts.slice(0, 20)
  const newReleases = filteredPosts.filter(
    post => new Date(post.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  )
  const popular = [...filteredPosts]
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 20)
  // Trending uses different algorithm - engagement velocity with recency boost
  const trending = [...filteredPosts]
    .map(post => {
      const ageHours = Math.max(
        1,
        (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60)
      )
      const engagement =
        (post.likes_count || 0) + (post.comments_count || 0) * 2 + (post.views_count || 0) * 0.1
      const velocity = engagement / ageHours
      const recencyBoost = ageHours < 24 ? 2.0 : ageHours < 72 ? 1.5 : 1.0
      return { post, trendingScore: velocity * recencyBoost }
    })
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, 20)
    .map(item => item.post)

  // Helper function to get completion status badge
  const getCompletionBadge = (status?: string) => {
    switch (status) {
      case 'complete':
        return (
          <Badge variant="default" className="bg-primary">
            Complete
          </Badge>
        )
      case 'wip':
        return <Badge variant="secondary">WIP</Badge>
      case 'hiatus':
        return <Badge variant="secondary">Hiatus</Badge>
      default:
        return <Badge variant="outline">Complete</Badge>
    }
  }

  // Helper function to format content type
  const formatContentType = (type?: string) => {
    switch (type) {
      case 'screenplay':
        return 'Screenplay'
      case 'stage_play':
        return 'Stage Play'
      case 'book':
        return 'Book'
      case 'short_story':
        return 'Short Story'
      case 'poetry':
        return 'Poetry'
      case 'article':
        return 'Article'
      case 'essay':
        return 'Essay'
      default:
        return 'Article'
    }
  }

  // Create WorkCard component for real posts
  const WorkCard = ({ post }: { post: Post }) => (
    <Card className="card-bg card-shadow border-border hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center font-bold text-lg shadow-md">
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
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  by {post.user?.display_name || 'Unknown Author'}
                </Link>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0 flex-wrap gap-2">
                {getCompletionBadge(post.completion_status)}
                <Badge variant="outline" className="border-border">
                  {formatContentType(post.content_type)}
                </Badge>
                {post.genre && (
                  <Badge variant="secondary" className="bg-muted">
                    {post.genre}
                  </Badge>
                )}
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
              {post.reading_time_minutes && (
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {post.reading_time_minutes} min read
                </div>
              )}
              <div className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                {post.user?.display_name || 'Unknown'}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>{(post.views_count || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  <span>{post.likes_count || 0}</span>
                </div>
                <div className="flex items-center">
                  <span>{post.comments_count || 0} comments</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-border hover:bg-muted" asChild>
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

  const contentTypes = [
    'screenplay',
    'stage_play',
    'book',
    'short_story',
    'poetry',
    'article',
    'essay',
  ]
  const completionStatuses = ['complete', 'wip', 'hiatus']
  const readingTimeRanges = [
    { label: '0-5 min', value: '0-5' },
    { label: '5-10 min', value: '5-10' },
    { label: '10-30 min', value: '10-30' },
    { label: '30+ min', value: '30+' },
  ]

  // Calculate active filter count
  const activeFilterCount =
    (selectedGenre ? 1 : 0) +
    filters.contentTypes.length +
    (filters.readingTime ? 1 : 0) +
    filters.completionStatus.length

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(selectedGenre === genre ? null : genre)
  }

  const handleClearFilters = () => {
    setSelectedGenre(null)
    setFilters({
      contentTypes: [],
      readingTime: null,
      completionStatus: [],
    })
    setFilterDialogOpen(false)
  }

  const handleContentTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter(t => t !== type)
        : [...prev.contentTypes, type],
    }))
  }

  const handleCompletionStatusToggle = (status: string) => {
    setFilters(prev => ({
      ...prev,
      completionStatus: prev.completionStatus.includes(status)
        ? prev.completionStatus.filter(s => s !== status)
        : [...prev.completionStatus, status],
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">Discover Works</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore novels, short stories, poetry, and plays from our community of writers.
              Discover your next great read.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8">
            <Card className="card-bg card-shadow border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search works by title, author, or genre..."
                      className="pl-10 border-border"
                    />
                  </div>
                  <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center space-x-2 border-border hover:bg-muted relative"
                      >
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                        {activeFilterCount > 0 && (
                          <Badge className="ml-2 bg-primary text-primary-foreground">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Filter Works</DialogTitle>
                        <DialogDescription>
                          Refine your search with advanced filters
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        {/* Content Type Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Content Type</Label>
                          <div className="flex flex-wrap gap-2">
                            {contentTypes.map(type => (
                              <Badge
                                key={type}
                                variant={
                                  filters.contentTypes.includes(type) ? 'default' : 'outline'
                                }
                                className={`cursor-pointer ${
                                  filters.contentTypes.includes(type)
                                    ? 'bg-primary hover:bg-primary/90'
                                    : 'hover:bg-muted'
                                }`}
                                onClick={() => handleContentTypeToggle(type)}
                              >
                                {formatContentType(type)}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Reading Time Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Reading Time</Label>
                          <div className="flex flex-wrap gap-2">
                            {readingTimeRanges.map(range => (
                              <Badge
                                key={range.value}
                                variant={
                                  filters.readingTime === range.value ? 'default' : 'outline'
                                }
                                className={`cursor-pointer ${
                                  filters.readingTime === range.value
                                    ? 'bg-primary hover:bg-primary/90'
                                    : 'hover:bg-muted'
                                }`}
                                onClick={() =>
                                  setFilters(prev => ({
                                    ...prev,
                                    readingTime:
                                      prev.readingTime === range.value ? null : range.value,
                                  }))
                                }
                              >
                                {range.label}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Completion Status Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Status</Label>
                          <div className="flex flex-wrap gap-2">
                            {completionStatuses.map(status => (
                              <Badge
                                key={status}
                                variant={
                                  filters.completionStatus.includes(status) ? 'default' : 'outline'
                                }
                                className={`cursor-pointer ${
                                  filters.completionStatus.includes(status)
                                    ? 'bg-primary hover:bg-primary/90'
                                    : 'hover:bg-muted'
                                }`}
                                onClick={() => handleCompletionStatusToggle(status)}
                              >
                                {status === 'wip'
                                  ? 'WIP'
                                  : status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between pt-4">
                          <Button variant="ghost" onClick={handleClearFilters}>
                            Clear All
                          </Button>
                          <Button
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => setFilterDialogOpen(false)}
                          >
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Genre Tags */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-3">Browse by Genre</p>
                  <div className="flex flex-wrap gap-2">
                    {genres.map(genre => (
                      <Badge
                        key={genre}
                        variant={selectedGenre === genre ? 'default' : 'secondary'}
                        className={`cursor-pointer transition-colors ${
                          selectedGenre === genre
                            ? 'bg-primary hover:bg-primary/90'
                            : 'bg-muted hover:bg-muted'
                        }`}
                        onClick={() => handleGenreClick(genre)}
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
            <Card className="card-bg border-border bg-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5 text-foreground" />
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
            <Card className="card-bg border-border bg-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Sparkles className="h-5 w-5 text-foreground" />
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
            <Card className="card-bg border-border bg-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Eye className="h-5 w-5 text-foreground" />
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
            <Card className="card-bg border-border bg-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Heart className="h-5 w-5 text-foreground" />
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
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted">
              <TabsTrigger
                value="featured"
                className="p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                <span className="text-sm">Featured</span>
              </TabsTrigger>
              <TabsTrigger
                value="new"
                className="p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="text-sm">New Releases</span>
              </TabsTrigger>
              <TabsTrigger
                value="popular"
                className="p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Star className="h-4 w-4 mr-2" />
                <span className="text-sm">Popular</span>
              </TabsTrigger>
              <TabsTrigger
                value="trending"
                className="p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Flame className="h-4 w-4 mr-2" />
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
