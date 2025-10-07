'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Skeleton } from '@/src/components/ui/skeleton'
import { SearchAutocomplete } from '@/src/components/search-autocomplete'
import { AdvancedSearchFilters, SearchFilters } from '@/src/components/advanced-search-filters'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Bookmark, Share2, Download, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/src/lib/supabase'
import { DatabaseService } from '@/src/lib/database'

const dbService = new DatabaseService()

interface SearchResult {
  id: string
  type: 'author' | 'work' | 'post'
  title?: string
  content?: string
  excerpt?: string
  author?: string
  authorId?: string
  avatar?: string
  relevance?: number
  [key: string]: any
}

export default function EnhancedSearchView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState<'authors' | 'works' | 'posts'>(
    (searchParams.get('type') as any) || 'posts'
  )
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [page, setPage] = useState(0)
  const [sessionId, setSessionId] = useState<string>('')
  const [searchStartTime, setSearchStartTime] = useState<number>(0)
  const [filters, setFilters] = useState<SearchFilters>({
    type: activeTab,
    sortBy: 'relevance',
  })

  // Generate session ID on mount
  useEffect(() => {
    setSessionId(crypto.randomUUID())
  }, [])

  // Perform search
  const performSearch = useCallback(
    async (query: string, reset = false) => {
      if (!query.trim()) {
        setResults([])
        setTotalResults(0)
        return
      }

      const startTime = Date.now()
      setSearchStartTime(startTime)
      setLoading(true)

      try {
        const currentPage = reset ? 0 : page
        const offset = currentPage * 20

        let searchResults: any[] = []

        if (activeTab === 'posts') {
          searchResults = await dbService.searchPostsFulltext(query, {
            limit: 20,
            offset,
            genre: filters.genre,
            contentType: filters.contentType,
            published: filters.published,
            minReadingTime: filters.minReadingTime,
            maxReadingTime: filters.maxReadingTime,
            sortBy: filters.sortBy,
          })
        } else if (activeTab === 'authors') {
          searchResults = await dbService.searchUsersFulltext(query, {
            limit: 20,
            offset,
            accountType: filters.accountType,
            verified: filters.verified,
            sortBy: filters.sortBy,
          })
        } else {
          // For works, use the basic search for now
          searchResults = await dbService.searchPosts(query, 20, offset)
        }

        const mappedResults: SearchResult[] = searchResults.map((item: any) => ({
          id: item.id,
          type: activeTab === 'authors' ? 'author' : activeTab === 'works' ? 'work' : 'post',
          title: item.title || item.display_name || item.username,
          content: item.content || item.bio,
          excerpt: item.excerpt,
          author: item.display_name || item.username,
          authorId: item.user_id || item.id,
          avatar: item.avatar_url,
          relevance: item.relevance_rank,
          ...item,
        }))

        if (reset) {
          setResults(mappedResults)
          setPage(0)
        } else {
          setResults(prev => [...prev, ...mappedResults])
        }

        setTotalResults(mappedResults.length)

        // Log search analytics
        const duration = Date.now() - startTime
        await fetch('/api/search/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
          },
          body: JSON.stringify({
            query,
            results_count: mappedResults.length,
            filters,
            search_duration_ms: duration,
          }),
        })
      } catch (error) {
        console.error('Search error:', error)
        toast.error('Search failed. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [activeTab, filters, page, sessionId]
  )

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (activeTab) params.set('type', activeTab)
    router.push(`/search?${params.toString()}`, { scroll: false })
  }, [searchQuery, activeTab, router])

  // Perform search when query or filters change
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery, true)
    }
  }, [searchQuery, filters, activeTab])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any)
    setFilters({ type: tab as any, sortBy: 'relevance' })
    setResults([])
    setPage(0)
  }

  const handleExport = () => {
    const csv = results.map(r => `"${r.title}","${r.type}","${r.author || ''}"`).join('\n')
    const blob = new Blob([`"Title","Type","Author"\n${csv}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `search-results-${Date.now()}.csv`
    a.click()
    toast.success('Results exported!')
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Search link copied to clipboard!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleSaveSearch = async () => {
    if (!supabase) {
      toast.error('Unable to save search')
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to save searches')
        return
      }

      const { error } = await supabase.from('saved_searches').insert({
        user_id: user.id,
        query: searchQuery,
        filters,
      })

      if (error) throw error
      toast.success('Search saved!')
    } catch (error) {
      console.error('Save search error:', error)
      toast.error('Failed to save search')
    }
  }

  const handleResultClick = async (result: SearchResult) => {
    // Log click analytics
    await fetch('/api/search/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
      },
      body: JSON.stringify({
        query: searchQuery,
        clicked_result_id: result.id,
        clicked_result_type: result.type,
        search_duration_ms: Date.now() - searchStartTime,
      }),
    })
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Header */}
        <div className="space-y-4">
          <h1 className="font-serif text-3xl font-bold">Search</h1>

          {/* Search Bar with Autocomplete */}
          <SearchAutocomplete
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={query => {
              setSearchQuery(query)
              performSearch(query, true)
            }}
            placeholder="Search for authors, works, or posts..."
            className="text-lg"
          />

          {/* Action Buttons */}
          {searchQuery && results.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSaveSearch}>
                <Bookmark className="h-4 w-4 mr-1" />
                Save Search
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="authors">Authors</TabsTrigger>
            <TabsTrigger value="works">Works</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="mt-4">
            <AdvancedSearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              activeTab={activeTab}
            />
          </div>

          {/* Results */}
          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {/* Results Summary */}
            {searchQuery && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {totalResults} {totalResults === 1 ? 'result' : 'results'} for &ldquo;
                  {searchQuery}&rdquo;
                </span>
                {filters.sortBy && filters.sortBy !== 'relevance' && (
                  <Badge variant="secondary">Sorted by: {filters.sortBy}</Badge>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && page === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="card-bg">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-20 w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="space-y-4">
                  {results.map(result => (
                    <Link
                      key={result.id}
                      href={
                        result.type === 'author'
                          ? `/profile/${result.author}`
                          : result.type === 'work'
                            ? `/works/${result.id}`
                            : `/posts/${result.id}`
                      }
                      onClick={() => handleResultClick(result)}
                    >
                      <Card className="card-bg border-literary-border hover:border-primary transition-colors cursor-pointer">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-start gap-4">
                            {result.avatar && (
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={result.avatar} alt={result.title} />
                                <AvatarFallback>
                                  {result.title?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-lg truncate">{result.title}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {result.type}
                                </Badge>
                                {result.relevance && (
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round(result.relevance * 100)}% match
                                  </span>
                                )}
                              </div>
                              {result.content && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {result.content.substring(0, 200)}
                                  {result.content.length > 200 ? '...' : ''}
                                </p>
                              )}
                              {result.author && result.type !== 'author' && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  by {result.author}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Load More */}
                {results.length >= 20 && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPage(p => p + 1)
                        performSearch(searchQuery, false)
                      }}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </>
            ) : searchQuery ? (
              <Card className="card-bg">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No results found for &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your filters or search term
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-bg">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Start typing to search</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
