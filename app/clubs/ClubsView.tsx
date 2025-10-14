'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Users, TrendingUp, Filter } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { CreateClubDialog } from './components/CreateClubDialog'
import { BookClub } from '@/src/lib/book-club-service'
import Link from 'next/link'

export function ClubsView() {
  const [clubs, setClubs] = useState<BookClub[]>([])
  const [myClubs, setMyClubs] = useState<BookClub[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    loadClubs()
  }, [selectedGenre, searchQuery])

  const loadClubs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedGenre && selectedGenre !== 'all') params.append('genre', selectedGenre)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/book-clubs?${params}`)
      const data = await response.json()
      setClubs(data.clubs || [])
    } catch (error) {
      console.error('Failed to load clubs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClubCreated = (club: BookClub) => {
    setClubs([club, ...clubs])
    setMyClubs([club, ...myClubs])
    setCreateDialogOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-4">Book Clubs</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join writing communities, exchange critiques, and grow together with fellow authors
            </p>
            <div className="flex gap-4">
              <Button size="lg" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Create a Club
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#browse">Browse Clubs</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-muted p-3 rounded-lg">
              <Users className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">{clubs.length}</div>
              <div className="text-sm text-muted-foreground">Active Clubs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8" id="browse">
        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="my-clubs">My Clubs</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clubs..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                <SelectItem value="fantasy">Fantasy</SelectItem>
                <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                <SelectItem value="romance">Romance</SelectItem>
                <SelectItem value="thriller">Thriller</SelectItem>
                <SelectItem value="mystery">Mystery</SelectItem>
                <SelectItem value="horror">Horror</SelectItem>
                <SelectItem value="literary">Literary Fiction</SelectItem>
                <SelectItem value="ya">Young Adult</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : clubs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No clubs found</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to create a club for this genre!
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Club
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map(club => (
                  <Card key={club.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{club.name}</CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-3 w-3" />
                              {club.member_count} members
                              {club.max_members && ` • ${club.max_members} max`}
                            </div>
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            club.club_type === 'public'
                              ? 'default'
                              : club.club_type === 'private'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {club.club_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {club.description || 'No description available'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {club.genre?.slice(0, 3).map(genre => (
                          <Badge key={genre} variant="outline" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" asChild>
                        <Link href={`/clubs/${club.id}`}>View Club</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Clubs Tab */}
          <TabsContent value="my-clubs">
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your Clubs</h3>
                <p className="text-muted-foreground mb-4">
                  Join clubs to see them here and start collaborating with other writers
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Featured Tab */}
          <TabsContent value="featured">
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Featured Clubs</h3>
                <p className="text-muted-foreground">Curated clubs coming soon!</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Club Dialog */}
      <CreateClubDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onClubCreated={handleClubCreated}
      />
    </div>
  )
}
