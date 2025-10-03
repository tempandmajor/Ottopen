'use client'

import { Navigation } from '@/src/components/navigation'
import { AuthorCard } from '@/src/components/author-card'
import { PostCard } from '@/src/components/post-card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Search, Users, BookOpen, MessageCircle, Star, Calendar, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { dbService } from '@/src/lib/database'
import type { User, Post } from '@/src/lib/supabase'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

function SearchContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchResults, setSearchResults] = useState({
    authors: [] as (User & { works?: number; followers?: number })[],
    works: [] as Post[],
    posts: [] as Post[],
  })
  const [hasMore, setHasMore] = useState(true)
  const [offsets, setOffsets] = useState({
    authors: 0,
    works: 0,
    posts: 0,
  })

  useEffect(() => {
    const query = searchParams.get('q')
    if (query) {
      setSearchQuery(query)
      performSearch(query)
    }
  }, [searchParams])

  const performSearch = async (query: string) => {
    // Validate and sanitize search query
    const sanitized = query.trim()

    if (!sanitized) {
      setSearchResults({ authors: [], works: [], posts: [] })
      setOffsets({ authors: 0, works: 0, posts: 0 })
      return
    }

    if (sanitized.length < 2) {
      toast.error('Search query must be at least 2 characters')
      return
    }

    if (sanitized.length > 100) {
      toast.error('Search query too long (max 100 characters)')
      return
    }

    try {
      setLoading(true)

      // Search for authors (users)
      const authors = await dbService.searchUsers(sanitized, 20)

      // Load detailed stats for authors using bulk query (95% query reduction)
      const authorIds = authors.map(author => author.id)
      const statsMap = await dbService.getBulkUserStatistics(authorIds)

      const authorsWithStats = authors.map(author => {
        const userStats = statsMap.get(author.id)
        return {
          ...author,
          works: userStats?.published_posts_count || 0,
          followers: userStats?.followers_count || 0,
        }
      })

      // Search for posts once, then filter for works
      const allPosts = await dbService.searchPosts(sanitized, 20)
      const publishedWorks = allPosts.filter(post => post.published)

      setSearchResults({
        authors: authorsWithStats,
        works: publishedWorks,
        posts: allPosts,
      })

      // Reset offsets
      setOffsets({
        authors: authorsWithStats.length,
        works: publishedWorks.length,
        posts: allPosts.length,
      })

      // Check if we have more results (if we got the full limit, likely more exist)
      setHasMore(
        authorsWithStats.length === 20 || publishedWorks.length === 20 || allPosts.length === 20
      )
    } catch (error) {
      toast.error('Search failed. Please try again.')
      setSearchResults({ authors: [], works: [], posts: [] })
      setOffsets({ authors: 0, works: 0, posts: 0 })
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!searchQuery.trim() || loadingMore) return

    try {
      setLoadingMore(true)

      // Only load more for the active tab to avoid unnecessary queries
      if (activeTab === 'all' || activeTab === 'authors') {
        const authors = await dbService.searchUsers(searchQuery, 20, offsets.authors)

        // Load detailed stats for authors using bulk query (95% query reduction)
        const authorIds = authors.map(author => author.id)
        const statsMap = await dbService.getBulkUserStatistics(authorIds)

        const authorsWithStats = authors.map(author => {
          const userStats = statsMap.get(author.id)
          return {
            ...author,
            works: userStats?.published_posts_count || 0,
            followers: userStats?.followers_count || 0,
          }
        })

        setSearchResults(prev => ({
          ...prev,
          authors: [...prev.authors, ...authorsWithStats],
        }))

        setOffsets(prev => ({
          ...prev,
          authors: prev.authors + authorsWithStats.length,
        }))
      }

      if (activeTab === 'all' || activeTab === 'works' || activeTab === 'posts') {
        const allPosts = await dbService.searchPosts(searchQuery, 20, offsets.posts)
        const publishedWorks = allPosts.filter(post => post.published)

        setSearchResults(prev => ({
          ...prev,
          works:
            activeTab === 'works' || activeTab === 'all'
              ? [...prev.works, ...publishedWorks]
              : prev.works,
          posts:
            activeTab === 'posts' || activeTab === 'all'
              ? [...prev.posts, ...allPosts]
              : prev.posts,
        }))

        setOffsets(prev => ({
          ...prev,
          works: prev.works + publishedWorks.length,
          posts: prev.posts + allPosts.length,
        }))
      }

      // Check if we have more results based on active tab
      setHasMore(true) // Simplified for now, can be improved per-tab
    } catch (error) {
      toast.error('Failed to load more results')
    } finally {
      setLoadingMore(false)
    }
  }

  const totalResults =
    searchResults.authors.length + searchResults.works.length + searchResults.posts.length

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Update URL with search query
      const url = new URL(window.location.href)
      url.searchParams.set('q', searchQuery.trim())
      window.history.pushState({}, '', url.toString())

      // Perform search
      performSearch(searchQuery.trim())
    }
  }

  const WorkCard = ({ work }: { work: Post }) => (
    <Card className="card-bg card-shadow border-literary-border hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
            <BookOpen className="h-8 w-8" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-semibold mb-1 truncate">{work.title}</h3>
                <p className="text-sm text-muted-foreground">
                  by {work.display_name || work.username || 'Unknown Author'}
                </p>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Badge variant={work.published ? 'default' : 'secondary'}>
                  {work.published ? 'Published' : 'Draft'}
                </Badge>
                <Badge variant="outline">Article</Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {work.excerpt || work.content?.substring(0, 150) + '...'}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-gray-600 mr-1" />
                  <span>{work.likes_count || 0}</span>
                </div>
                <div className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span>{work.comments_count || 0} comments</span>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/posts/${work.id}`}>Read</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-4">
            {searchQuery ? `Search Results for &quot;${searchQuery}&quot;` : 'Search Ottopen'}
          </h1>

          {/* Search Form */}
          <Card className="card-bg card-shadow border-literary-border">
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for authors, works, posts, or topics..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 border-literary-border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Search</Button>
                  {/* Filter functionality to be implemented */}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {searchQuery && (
          <>
            {/* Results Summary */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </span>
                ) : (
                  `Found ${totalResults} results for "${searchQuery}"`
                )}
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Just updated</span>
              </div>
            </div>

            {/* Search Results Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                <TabsTrigger value="all" className="p-3">
                  <span className="text-sm">All ({totalResults})</span>
                </TabsTrigger>
                <TabsTrigger value="authors" className="p-3">
                  <span className="text-sm">Authors ({searchResults.authors.length})</span>
                </TabsTrigger>
                <TabsTrigger value="works" className="p-3">
                  <span className="text-sm">Works ({searchResults.works.length})</span>
                </TabsTrigger>
                <TabsTrigger value="posts" className="p-3">
                  <span className="text-sm">Posts ({searchResults.posts.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-8">
                {loading ? (
                  <div className="space-y-6">
                    {/* Author skeletons */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {[1, 2].map(i => (
                        <Card key={`author-${i}`} className="p-6">
                          <div className="flex items-start space-x-4">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-16 w-full" />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    {/* Work skeletons */}
                    <div className="space-y-4">
                      {[1, 2].map(i => (
                        <Card key={`work-${i}`} className="p-6">
                          <div className="flex space-x-4">
                            <Skeleton className="h-20 w-16 rounded-lg" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-5 w-48" />
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-12 w-full" />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Authors Section */}
                    {searchResults.authors.length > 0 && (
                      <section>
                        <div className="flex items-center space-x-2 mb-4">
                          <Users className="h-5 w-5" />
                          <h2 className="font-serif text-xl font-semibold">Authors</h2>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {searchResults.authors.map(author => (
                            <AuthorCard
                              key={author.id}
                              name={author.display_name || author.username}
                              specialty={author.specialty || 'Writer'}
                              location={author.location || 'Location not specified'}
                              works={author.works || 0}
                              followers={author.followers || 0}
                              bio={author.bio || 'No bio available.'}
                              avatar={author.avatar_url}
                              tags={author.specialty ? [author.specialty] : ['Writer']}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {searchResults.authors.length > 0 &&
                      (searchResults.works.length > 0 || searchResults.posts.length > 0) && (
                        <Separator />
                      )}

                    {/* Works Section */}
                    {searchResults.works.length > 0 && (
                      <section>
                        <div className="flex items-center space-x-2 mb-4">
                          <BookOpen className="h-5 w-5" />
                          <h2 className="font-serif text-xl font-semibold">Works</h2>
                        </div>
                        <div className="space-y-4">
                          {searchResults.works.map(work => (
                            <WorkCard key={work.id} work={work} />
                          ))}
                        </div>
                      </section>
                    )}

                    {searchResults.works.length > 0 && searchResults.posts.length > 0 && (
                      <Separator />
                    )}

                    {/* Posts Section */}
                    {searchResults.posts.length > 0 && (
                      <section>
                        <div className="flex items-center space-x-2 mb-4">
                          <MessageCircle className="h-5 w-5" />
                          <h2 className="font-serif text-xl font-semibold">Posts</h2>
                        </div>
                        <div className="space-y-4">
                          {searchResults.posts.map(post => (
                            <PostCard
                              key={post.id}
                              author={post.display_name || post.username || 'Unknown Author'}
                              avatar={post.avatar_url}
                              time={new Date(post.created_at).toLocaleDateString()}
                              content={post.content}
                              type="discussion"
                              likes={post.likes_count || 0}
                              comments={post.comments_count || 0}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {totalResults === 0 && !loading && searchQuery && (
                      <div className="text-center py-8">
                        <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h2 className="font-serif text-2xl font-semibold mb-2">No Results Found</h2>
                        <p className="text-muted-foreground">
                          We couldn&apos;t find anything matching &quot;{searchQuery}&quot;. Try
                          different keywords or browse our community.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="authors" className="space-y-6">
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2 text-muted-foreground">Searching authors...</p>
                  </div>
                ) : searchResults.authors.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {searchResults.authors.map(author => (
                      <AuthorCard
                        key={author.id}
                        name={author.display_name || author.username}
                        specialty={author.specialty || 'Writer'}
                        location={author.location || 'Location not specified'}
                        works={author.works || 0}
                        followers={author.followers || 0}
                        bio={author.bio || 'No bio available.'}
                        avatar={author.avatar_url}
                        tags={author.specialty ? [author.specialty] : ['Writer']}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-serif text-xl font-semibold mb-2">No Authors Found</h3>
                    <p className="text-muted-foreground">No authors match your search criteria.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="works" className="space-y-6">
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2 text-muted-foreground">Searching works...</p>
                  </div>
                ) : searchResults.works.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.works.map(work => (
                      <WorkCard key={work.id} work={work} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-serif text-xl font-semibold mb-2">No Works Found</h3>
                    <p className="text-muted-foreground">
                      No published works match your search criteria.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="posts" className="space-y-6">
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2 text-muted-foreground">Searching posts...</p>
                  </div>
                ) : searchResults.posts.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.posts.map(post => (
                      <PostCard
                        key={post.id}
                        author={post.display_name || post.username || 'Unknown Author'}
                        avatar={post.avatar_url}
                        time={new Date(post.created_at).toLocaleDateString()}
                        content={post.content}
                        type="discussion"
                        likes={post.likes_count || 0}
                        comments={post.comments_count || 0}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-serif text-xl font-semibold mb-2">No Posts Found</h3>
                    <p className="text-muted-foreground">No posts match your search criteria.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Load More */}
            {hasMore && (
              <div className="text-center pt-8">
                <Button variant="outline" size="lg" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading More...
                    </>
                  ) : (
                    'Load More Results'
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {!searchQuery && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-semibold mb-2">Discover the Literary World</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Search for your favorite authors, discover new works, or find discussions on topics
              you love.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
                <h2 className="font-serif text-2xl font-semibold mb-2">Loading Search...</h2>
                <p className="text-muted-foreground">
                  Please wait while we prepare your search experience.
                </p>
              </div>
            </div>
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </div>
  )
}
