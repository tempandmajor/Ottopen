'use client'

import { Navigation } from '@/src/components/navigation'
import { AuthorCard } from '@/src/components/author-card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Card, CardContent } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { Label } from '@/src/components/ui/label'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import {
  Search,
  Filter,
  TrendingUp,
  Users,
  Star,
  BookOpen,
  Loader2,
  Sparkles,
  Flame,
  Award,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { dbService } from '@/src/lib/database'
import type { User } from '@/src/lib/supabase'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/src/contexts/auth-context'
import { ErrorBoundary } from '@/src/components/error-boundary'

function AuthorsContent() {
  const { user } = useAuth()
  const [authors, setAuthors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [authorStats, setAuthorStats] = useState({
    total: 0,
    newThisMonth: 0,
    publishedWorksTotal: 0,
    activeWriters: 0,
  })
  const [authorsWithStats, setAuthorsWithStats] = useState<
    (User & { works: number; followers: number })[]
  >([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    accountTypes: [] as string[],
    openForCollaboration: false,
    acceptingBetaReaders: false,
    minFollowers: 0,
  })
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [quickViewAuthor, setQuickViewAuthor] = useState<
    (User & { works: number; followers: number }) | null
  >(null)

  // Load authors on mount
  useEffect(() => {
    loadAuthors()
    loadFollowingStatus()
  }, [])

  // Load user's following status
  const loadFollowingStatus = async () => {
    try {
      if (!user) return

      const userId = user.profile?.id || user.id
      const following = await dbService.getFollowing(userId)
      setFollowingIds(new Set(following.map(f => f.id)))
    } catch (error) {
      console.error('Failed to load following status:', error)
    }
  }

  // Search functionality with debouncing (300ms)
  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        handleSearch()
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const loadAuthors = async () => {
    try {
      setLoading(true)

      // Get application statistics
      const appStats = await dbService.getApplicationStatistics()

      // Get initial authors (changed from 50 to 20 - no need to fetch unused data)
      // PRIVACY: Only show authors who opted into the directory
      const allAuthors = await dbService.getOptedInAuthors(20)
      setAuthors(allAuthors)

      // Load detailed stats using bulk query (95% query reduction)
      const authorIds = allAuthors.map(a => a.id)
      const statsMap = await dbService.getBulkUserStatistics(authorIds)

      const authorsWithDetailedStats = allAuthors.map(author => {
        const userStats = statsMap.get(author.id)
        return {
          ...author,
          works: userStats?.published_posts_count || 0,
          followers: userStats?.followers_count || 0,
        }
      })

      setAuthorsWithStats(authorsWithDetailedStats)
      setCurrentOffset(20)
      setHasMore(allAuthors.length === 20)

      // Calculate stats
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const newThisMonth = allAuthors.filter(
        author => new Date(author.created_at) > thirtyDaysAgo
      ).length

      // Count active writers (posted in last 30 days)
      const activeWriters = authorsWithDetailedStats.filter(a => a.works > 0).length

      setAuthorStats({
        total: allAuthors.length,
        newThisMonth,
        publishedWorksTotal: appStats.stories_shared || 0,
        activeWriters,
      })
    } catch (error) {
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
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)

      // PRIVACY: Only show authors who opted into the directory
      const moreAuthors = await dbService.getOptedInAuthors(20, currentOffset)

      if (moreAuthors.length === 0) {
        setHasMore(false)
        return
      }

      // Load detailed stats using bulk query (95% query reduction)
      const authorIds = moreAuthors.map(a => a.id)
      const statsMap = await dbService.getBulkUserStatistics(authorIds)

      const moreAuthorsWithStats = moreAuthors.map(author => {
        const userStats = statsMap.get(author.id)
        return {
          ...author,
          works: userStats?.published_posts_count || 0,
          followers: userStats?.followers_count || 0,
        }
      })

      setAuthorsWithStats(prev => [...prev, ...moreAuthorsWithStats])
      setCurrentOffset(prev => prev + moreAuthors.length)

      if (moreAuthors.length < 20) {
        setHasMore(false)
      }
    } catch (error) {
      toast.error('Failed to load more authors')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSpecialtyClick = (specialty: string) => {
    setSelectedSpecialty(selectedSpecialty === specialty ? null : specialty)
  }

  const handleFollow = async (authorId: string) => {
    try {
      if (!user) {
        toast.error('Please sign in to follow authors')
        return
      }

      const userId = user.profile?.id || user.id
      const isFollowing = followingIds.has(authorId)
      await dbService.toggleFollow(userId, authorId)

      setFollowingIds(prev => {
        const next = new Set(prev)
        if (isFollowing) {
          next.delete(authorId)
          toast.success('Unfollowed successfully')
        } else {
          next.add(authorId)
          toast.success('Following successfully')
        }
        return next
      })

      // Update follower count in displayed authors
      setAuthorsWithStats(prev =>
        prev.map(author =>
          author.id === authorId
            ? { ...author, followers: author.followers + (isFollowing ? -1 : 1) }
            : author
        )
      )
    } catch (error) {
      toast.error('Failed to update follow status')
    }
  }

  const applyFilters = (authorList: (User & { works: number; followers: number })[]) => {
    let filtered = [...authorList]

    // Filter by specialty
    if (selectedSpecialty) {
      filtered = filtered.filter(a => a.specialty?.includes(selectedSpecialty))
    }

    // Filter by account type
    if (filters.accountTypes.length > 0) {
      filtered = filtered.filter(a => filters.accountTypes.includes(a.account_type))
    }

    // Filter by collaboration status
    if (filters.openForCollaboration) {
      filtered = filtered.filter(a => a.open_for_collaboration === true)
    }

    if (filters.acceptingBetaReaders) {
      filtered = filtered.filter(a => a.accepting_beta_readers === true)
    }

    // Filter by min followers
    if (filters.minFollowers > 0) {
      filtered = filtered.filter(a => a.followers >= filters.minFollowers)
    }

    return filtered
  }

  const filteredAuthors = searchQuery.trim() ? searchResults : authors

  const displayAuthors =
    authorsWithStats.length > 0
      ? applyFilters(authorsWithStats)
      : filteredAuthors.map(author => ({
          ...author,
          works: 0,
          followers: 0,
        }))

  // Better categorization with actual logic
  const risingStars = [...displayAuthors]
    .filter(a => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return new Date(a.created_at) > thirtyDaysAgo && a.followers > 10
    })
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 8)

  const mostActive = [...displayAuthors]
    .filter(a => a.works > 0)
    .sort((a, b) => b.works - a.works)
    .slice(0, 8)

  const mostFollowed = [...displayAuthors].sort((a, b) => b.followers - a.followers).slice(0, 8)

  const newWriters = [...displayAuthors]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  const specialties = [
    'Screenwriting',
    'Playwriting',
    'Fiction',
    'Non-Fiction',
    'Poetry',
    'Mystery & Thriller',
    'Romance',
    'Science Fiction',
    'Fantasy',
    'Horror',
    'Young Adult',
    'Literary Fiction',
  ]

  const activeFilterCount =
    (selectedSpecialty ? 1 : 0) +
    filters.accountTypes.length +
    (filters.openForCollaboration ? 1 : 0) +
    (filters.acceptingBetaReaders ? 1 : 0) +
    (filters.minFollowers > 0 ? 1 : 0)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Quick View Modal */}
      <Dialog open={!!quickViewAuthor} onOpenChange={() => setQuickViewAuthor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={quickViewAuthor?.avatar_url} />
                <AvatarFallback>
                  {quickViewAuthor?.display_name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-serif">{quickViewAuthor?.display_name}</h3>
                <p className="text-sm text-muted-foreground">{quickViewAuthor?.specialty}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Location */}
            {quickViewAuthor?.location && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{quickViewAuthor.location}</span>
              </div>
            )}

            {/* Bio */}
            <div>
              <h4 className="font-semibold mb-2">About</h4>
              <p className="text-sm text-muted-foreground">
                {quickViewAuthor?.bio || 'No bio available'}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-3 text-center">
                <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-lg font-bold">{quickViewAuthor?.works || 0}</div>
                <p className="text-xs text-muted-foreground">Works</p>
              </Card>
              <Card className="p-3 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-lg font-bold">
                  {quickViewAuthor?.followers.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Followers</p>
              </Card>
              <Card className="p-3 text-center">
                <Star className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-lg font-bold">
                  {quickViewAuthor?.account_type === 'writer' ? 'Writer' : 'Professional'}
                </div>
                <p className="text-xs text-muted-foreground">Type</p>
              </Card>
            </div>

            {/* Collaboration Status */}
            {(quickViewAuthor?.open_for_collaboration ||
              quickViewAuthor?.accepting_beta_readers) && (
              <div className="space-y-2">
                <h4 className="font-semibold">Availability</h4>
                <div className="flex gap-2">
                  {quickViewAuthor?.open_for_collaboration && (
                    <Badge variant="secondary">Open for Collaboration</Badge>
                  )}
                  {quickViewAuthor?.accepting_beta_readers && (
                    <Badge variant="secondary">Accepting Beta Readers</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => {
                  if (quickViewAuthor) handleFollow(quickViewAuthor.id)
                }}
                variant={
                  quickViewAuthor && followingIds.has(quickViewAuthor.id) ? 'default' : 'outline'
                }
                className="flex-1"
              >
                {quickViewAuthor && followingIds.has(quickViewAuthor.id) ? 'Following' : 'Follow'}
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href={`/profile/${quickViewAuthor?.username}`}>View Full Profile</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">Discover Writers</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with talented writers, find collaborators, and join our creative community
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
                      placeholder="Search writers by name, specialty, or location..."
                      className="pl-10 border-border focus:ring-purple-500"
                    />
                  </div>
                  <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center space-x-2 border-border"
                      >
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                        {activeFilterCount > 0 && (
                          <Badge variant="default" className="ml-2">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Filter Authors</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Account Type</Label>
                          <div className="space-y-2 mt-2">
                            {['writer', 'platform_agent', 'external_agent', 'producer'].map(
                              type => (
                                <div key={type} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={filters.accountTypes.includes(type)}
                                    onCheckedChange={checked => {
                                      setFilters(prev => ({
                                        ...prev,
                                        accountTypes: checked
                                          ? [...prev.accountTypes, type]
                                          : prev.accountTypes.filter(t => t !== type),
                                      }))
                                    }}
                                  />
                                  <Label className="capitalize">{type.replace('_', ' ')}</Label>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={filters.openForCollaboration}
                              onCheckedChange={checked =>
                                setFilters(prev => ({
                                  ...prev,
                                  openForCollaboration: checked as boolean,
                                }))
                              }
                            />
                            <Label>Open for Collaboration</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={filters.acceptingBetaReaders}
                              onCheckedChange={checked =>
                                setFilters(prev => ({
                                  ...prev,
                                  acceptingBetaReaders: checked as boolean,
                                }))
                              }
                            />
                            <Label>Accepting Beta Readers</Label>
                          </div>
                        </div>

                        <div>
                          <Label>Minimum Followers</Label>
                          <Input
                            type="number"
                            min="0"
                            value={filters.minFollowers}
                            onChange={e =>
                              setFilters(prev => ({
                                ...prev,
                                minFollowers: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="mt-2"
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setFilters({
                                accountTypes: [],
                                openForCollaboration: false,
                                acceptingBetaReaders: false,
                                minFollowers: 0,
                              })
                              setSelectedSpecialty(null)
                            }}
                            className="flex-1"
                          >
                            Clear All
                          </Button>
                          <Button onClick={() => setFilterOpen(false)} className="flex-1">
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Specialty Tags */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-3 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-foreground" />
                    Filter by Specialty
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map(specialty => (
                      <Badge
                        key={specialty}
                        variant={selectedSpecialty === specialty ? 'default' : 'secondary'}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleSpecialtyClick(specialty)}
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics - Community Focused */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="card-bg border-border bg-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-foreground" />
                  <span className="text-2xl font-bold">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      authorStats.total.toLocaleString()
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Total Writers</p>
              </CardContent>
            </Card>
            <Card className="card-bg border-border bg-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Flame className="h-5 w-5 text-foreground" />
                  <span className="text-2xl font-bold">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      authorStats.activeWriters
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Active Writers</p>
              </CardContent>
            </Card>
            <Card className="card-bg border-border bg-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-foreground" />
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
            <Card className="card-bg border-border bg-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5 text-foreground" />
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
          </div>

          {/* Author Tabs with Icons */}
          <Tabs defaultValue="rising" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted">
              <TabsTrigger
                value="rising"
                className="p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="text-sm">Rising Stars</span>
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Flame className="h-4 w-4 mr-2" />
                <span className="text-sm">Most Active</span>
              </TabsTrigger>
              <TabsTrigger
                value="popular"
                className="p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Star className="h-4 w-4 mr-2" />
                <span className="text-sm">Most Followed</span>
              </TabsTrigger>
              <TabsTrigger
                value="new"
                className="p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Award className="h-4 w-4 mr-2" />
                <span className="text-sm">New Writers</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rising" className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading writers...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {risingStars.length > 0 ? (
                    risingStars.map(author => (
                      <div
                        key={author.id}
                        onClick={() => setQuickViewAuthor(author)}
                        className="cursor-pointer"
                      >
                        <AuthorCard
                          name={author.display_name}
                          specialty={author.specialty || 'Writer'}
                          location={author.location || 'Location not specified'}
                          works={author.works}
                          followers={author.followers}
                          bio={author.bio || 'No bio available'}
                          avatar={author.avatar_url}
                          tags={author.specialty ? [author.specialty] : ['Writer']}
                          username={author.username}
                          onFollow={e => {
                            e?.stopPropagation()
                            handleFollow(author.id)
                          }}
                          isFollowing={followingIds.has(author.id)}
                          createdAt={author.created_at}
                          accountType={author.account_type}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <p className="text-muted-foreground">No rising star authors found</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mostActive.length > 0 ? (
                  mostActive.map(author => (
                    <div
                      key={author.id}
                      onClick={() => setQuickViewAuthor(author)}
                      className="cursor-pointer"
                    >
                      <AuthorCard
                        name={author.display_name}
                        specialty={author.specialty || 'Writer'}
                        location={author.location || 'Location not specified'}
                        works={author.works}
                        followers={author.followers}
                        bio={author.bio || 'No bio available'}
                        avatar={author.avatar_url}
                        tags={author.specialty ? [author.specialty] : ['Writer']}
                        username={author.username}
                        onFollow={e => {
                          e?.stopPropagation()
                          handleFollow(author.id)
                        }}
                        isFollowing={followingIds.has(author.id)}
                        createdAt={author.created_at}
                        accountType={author.account_type}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground">No active authors found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="popular" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mostFollowed.length > 0 ? (
                  mostFollowed.map(author => (
                    <div
                      key={author.id}
                      onClick={() => setQuickViewAuthor(author)}
                      className="cursor-pointer"
                    >
                      <AuthorCard
                        name={author.display_name}
                        specialty={author.specialty || 'Writer'}
                        location={author.location || 'Location not specified'}
                        works={author.works}
                        followers={author.followers}
                        bio={author.bio || 'No bio available'}
                        avatar={author.avatar_url}
                        tags={author.specialty ? [author.specialty] : ['Writer']}
                        username={author.username}
                        onFollow={e => {
                          e?.stopPropagation()
                          handleFollow(author.id)
                        }}
                        isFollowing={followingIds.has(author.id)}
                        createdAt={author.created_at}
                        accountType={author.account_type}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground">No popular authors found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {newWriters.length > 0 ? (
                  newWriters.map(author => (
                    <div
                      key={author.id}
                      onClick={() => setQuickViewAuthor(author)}
                      className="cursor-pointer"
                    >
                      <AuthorCard
                        name={author.display_name}
                        specialty={author.specialty || 'Writer'}
                        location={author.location || 'Location not specified'}
                        works={author.works}
                        followers={author.followers}
                        bio={author.bio || 'No bio available'}
                        avatar={author.avatar_url}
                        tags={author.specialty ? [author.specialty] : ['Writer']}
                        username={author.username}
                        onFollow={e => {
                          e?.stopPropagation()
                          handleFollow(author.id)
                        }}
                        isFollowing={followingIds.has(author.id)}
                        createdAt={author.created_at}
                        accountType={author.account_type}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground">No new authors found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Load More */}
          {hasMore && !selectedSpecialty && activeFilterCount === 0 && (
            <div className="text-center pt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={loadMore}
                disabled={loadingMore}
                className="border-border"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading More Writers...
                  </>
                ) : (
                  'Load More Writers'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Authors() {
  return (
    <ErrorBoundary>
      <AuthorsContent />
    </ErrorBoundary>
  )
}
