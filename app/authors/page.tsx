'use client'

import { Navigation } from '@/src/components/navigation'
import { AuthorCard } from '@/src/components/author-card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Card, CardContent } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { Search, Filter, TrendingUp, Users, Star, BookOpen, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { dbService } from '@/src/lib/database'
import type { User } from '@/src/lib/supabase'
import { toast } from 'react-hot-toast'

export default function Authors() {
  const [authors, setAuthors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [authorStats, setAuthorStats] = useState({
    total: 0,
    newThisMonth: 0,
    publishedWorksTotal: 0,
  })
  const [authorsWithStats, setAuthorsWithStats] = useState<
    (User & { works: number; followers: number })[]
  >([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)

  // Load authors on mount
  useEffect(() => {
    loadAuthors()
  }, [])

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const loadAuthors = async () => {
    try {
      setLoading(true)

      // Get application statistics for published works total
      const appStats = await dbService.getApplicationStatistics()

      // Get random sample of authors
      const allAuthors = await dbService.searchUsers('', 50)
      setAuthors(allAuthors)

      // Load detailed stats for each author
      const authorsWithDetailedStats = await Promise.all(
        allAuthors.slice(0, 20).map(async author => {
          const userStats = await dbService.getUserStatistics(author.id)
          const works = userStats?.published_posts_count || 0
          const followers = userStats?.followers_count || 0

          return {
            ...author,
            works,
            followers,
          }
        })
      )

      setAuthorsWithStats(authorsWithDetailedStats)
      setCurrentOffset(20)
      setHasMore(allAuthors.length > 20)

      // Calculate new this month (users created in the last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const newThisMonth = allAuthors.filter(
        author => new Date(author.created_at) > thirtyDaysAgo
      ).length

      setAuthorStats({
        total: allAuthors.length,
        newThisMonth,
        publishedWorksTotal: appStats.stories_shared || 0,
      })
    } catch (error) {
      console.error('Failed to load authors:', error)
      toast.error('Failed to load authors')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setSearching(true)
      const results = await dbService.searchUsers(searchQuery, 20)
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

      // Get more authors starting from current offset
      const moreAuthors = await dbService.searchUsers('', 20, currentOffset)

      if (moreAuthors.length === 0) {
        setHasMore(false)
        return
      }

      // Load detailed stats for new authors
      const moreAuthorsWithStats = await Promise.all(
        moreAuthors.map(async author => {
          const userStats = await dbService.getUserStatistics(author.id)
          const works = userStats?.published_posts_count || 0
          const followers = userStats?.followers_count || 0

          return {
            ...author,
            works,
            followers,
          }
        })
      )

      // Append to existing authors
      setAuthorsWithStats(prev => [...prev, ...moreAuthorsWithStats])
      setCurrentOffset(prev => prev + moreAuthors.length)

      // Check if we have more
      if (moreAuthors.length < 20) {
        setHasMore(false)
      }

      toast.success(`Loaded ${moreAuthors.length} more authors`)
    } catch (error) {
      console.error('Failed to load more authors:', error)
      toast.error('Failed to load more authors')
    } finally {
      setLoadingMore(false)
    }
  }

  const filteredAuthors = searchQuery.trim() ? searchResults : authors

  // Use authors with stats when available, otherwise use regular authors
  const displayAuthors =
    authorsWithStats.length > 0
      ? authorsWithStats
      : filteredAuthors.map(author => ({
          ...author,
          works: 0,
          followers: 0,
        }))

  const featuredAuthors = displayAuthors.slice(0, 8)
  const newAuthors = displayAuthors.slice(8, 12)
  const trendingAuthors = displayAuthors.slice(4, 7)
  const mostFollowed = [...displayAuthors].sort((a, b) => b.followers - a.followers).slice(0, 3)

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
    'Screenwriting',
    'Playwriting',
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">Discover Authors</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with writers from around the world. Find your next favorite author or discover
              new voices in literature.
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
                      placeholder="Search authors by name, specialty, or location..."
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
                  <p className="text-sm font-medium mb-3">Popular Genres</p>
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
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      authorStats.total.toLocaleString()
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Active Authors</p>
              </CardContent>
            </Card>
            <Card className="card-bg border-literary-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      authorStats.publishedWorksTotal.toLocaleString()
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Published Works</p>
              </CardContent>
            </Card>
            <Card className="card-bg border-literary-border">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      authorStats.newThisMonth
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">New This Month</p>
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
                      authorStats.total.toLocaleString()
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Total Authors</p>
              </CardContent>
            </Card>
          </div>

          {/* Author Tabs */}
          <Tabs defaultValue="featured" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1">
              <TabsTrigger value="featured" className="p-3">
                <span className="text-sm">Featured</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="p-3">
                <span className="text-sm">Trending</span>
              </TabsTrigger>
              <TabsTrigger value="new" className="p-3">
                <span className="text-sm">New</span>
              </TabsTrigger>
              <TabsTrigger value="popular" className="p-3">
                <span className="text-sm">Most Followed</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="featured" className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading authors...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featuredAuthors.length > 0 ? (
                    featuredAuthors.map(author => (
                      <AuthorCard
                        key={author.id}
                        name={author.display_name}
                        specialty={author.specialty || 'Writer'}
                        location={author.location || 'Location not specified'}
                        works={author.works}
                        followers={author.followers}
                        bio={author.bio || 'No bio available'}
                        avatar={author.avatar_url}
                        tags={author.specialty ? [author.specialty] : ['Writer']}
                        username={author.username}
                      />
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <p className="text-muted-foreground">No authors found</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trending" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {trendingAuthors.length > 0 ? (
                  trendingAuthors.map(author => (
                    <AuthorCard
                      key={author.id}
                      name={author.display_name}
                      specialty={author.specialty || 'Writer'}
                      location={author.location || 'Location not specified'}
                      works={author.works}
                      followers={author.followers}
                      bio={author.bio || 'No bio available'}
                      avatar={author.avatar_url}
                      tags={author.specialty ? [author.specialty] : ['Writer']}
                      username={author.username}
                    />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground">No trending authors found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {newAuthors.length > 0 ? (
                  newAuthors.map(author => (
                    <AuthorCard
                      key={author.id}
                      name={author.display_name}
                      specialty={author.specialty || 'Writer'}
                      location={author.location || 'Location not specified'}
                      works={author.works}
                      followers={author.followers}
                      bio={author.bio || 'No bio available'}
                      avatar={author.avatar_url}
                      tags={author.specialty ? [author.specialty] : ['Writer']}
                      username={author.username}
                    />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground">No new authors found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="popular" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mostFollowed.length > 0 ? (
                  mostFollowed.map(author => (
                    <AuthorCard
                      key={author.id}
                      name={author.display_name}
                      specialty={author.specialty || 'Writer'}
                      location={author.location || 'Location not specified'}
                      works={author.works}
                      followers={author.followers}
                      bio={author.bio || 'No bio available'}
                      avatar={author.avatar_url}
                      tags={author.specialty ? [author.specialty] : ['Writer']}
                      username={author.username}
                    />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground">No popular authors found</p>
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
                    Loading More Authors...
                  </>
                ) : (
                  'Load More Authors'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
