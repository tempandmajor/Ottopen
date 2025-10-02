'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  MessageSquare,
  Calendar,
  BookOpen,
  Settings,
  UserPlus,
  LogOut,
  Bell,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { BookClub, ClubMembership } from '@/src/lib/book-club-service'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'

interface ClubDetailViewProps {
  clubId: string
}

export function ClubDetailView({ clubId }: ClubDetailViewProps) {
  const [club, setClub] = useState<BookClub | null>(null)
  const [membership, setMembership] = useState<ClubMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    loadClubData()
  }, [clubId])

  const loadClubData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/book-clubs/${clubId}`)
      const data = await response.json()
      setClub(data.club)
    } catch (error) {
      console.error('Failed to load club:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinClub = async () => {
    try {
      setJoining(true)
      const response = await fetch(`/api/book-clubs/${clubId}/join`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to join club')

      const data = await response.json()
      setMembership(data.membership)
      loadClubData() // Refresh to update member count
    } catch (error: any) {
      console.error('Failed to join club:', error)
      alert(error.message || 'Failed to join club')
    } finally {
      setJoining(false)
    }
  }

  const handleLeaveClub = async () => {
    if (!confirm('Are you sure you want to leave this club?')) return

    try {
      const response = await fetch(`/api/book-clubs/${clubId}/join`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to leave club')

      setMembership(null)
      loadClubData()
    } catch (error: any) {
      console.error('Failed to leave club:', error)
      alert(error.message || 'Failed to leave club')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="bg-gray-200 h-64"></div>
        <div className="container mx-auto px-4 py-8">
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Club not found</h3>
            <p className="text-gray-600">The club you&apos;re looking for doesn&apos;t exist.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isMember = membership?.status === 'active'
  const isPending = membership?.status === 'pending'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary">{club.club_type}</Badge>
                {club.genre?.slice(0, 3).map(genre => (
                  <Badge key={genre} variant="outline" className="border-white text-white">
                    {genre}
                  </Badge>
                ))}
              </div>
              <h1 className="text-4xl font-bold mb-3">{club.name}</h1>
              <p className="text-lg text-blue-100 max-w-3xl">{club.description}</p>

              <div className="flex items-center gap-6 mt-6 text-blue-100">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{club.member_count} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(club.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {!isMember && !isPending && (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleJoinClub}
                  disabled={joining}
                  className="bg-white text-blue-600"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {joining ? 'Joining...' : 'Join Club'}
                </Button>
              )}
              {isPending && (
                <Button size="lg" variant="secondary" disabled className="bg-white/50">
                  Request Pending
                </Button>
              )}
              {isMember && (
                <>
                  <Button size="lg" variant="secondary" className="bg-white text-blue-600">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {isMember ? (
          <Tabs defaultValue="discussions" className="space-y-6">
            <TabsList>
              <TabsTrigger value="discussions">
                <MessageSquare className="mr-2 h-4 w-4" />
                Discussions
              </TabsTrigger>
              <TabsTrigger value="critiques">
                <BookOpen className="mr-2 h-4 w-4" />
                Critique Exchange
              </TabsTrigger>
              <TabsTrigger value="members">
                <Users className="mr-2 h-4 w-4" />
                Members
              </TabsTrigger>
              <TabsTrigger value="events">
                <Calendar className="mr-2 h-4 w-4" />
                Events
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discussions">
              <Card>
                <CardHeader>
                  <CardTitle>Discussions</CardTitle>
                  <CardDescription>Join conversations with fellow club members</CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No discussions yet. Start one!</p>
                  <Button className="mt-4">Create Discussion</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="critiques">
              <Card>
                <CardHeader>
                  <CardTitle>Critique Exchange</CardTitle>
                  <CardDescription>
                    Submit your work for feedback and critique others to earn credits
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You have {membership?.credits || 0} credits</p>
                  <div className="flex gap-3 justify-center mt-4">
                    <Button>Submit for Critique</Button>
                    <Button variant="outline">Browse Submissions</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>{club.member_count} Members</CardTitle>
                  <CardDescription>Active community members</CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Member directory coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Join club activities and writing sessions</CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming events</p>
                  <Button className="mt-4">Create Event</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Join to access club content</CardTitle>
              <CardDescription>
                Become a member to participate in discussions, exchange critiques, and more
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-4">What you&apos;ll get:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                <div className="flex gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Active Discussions</div>
                    <p className="text-sm text-gray-600">Connect with writers and share ideas</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Critique Exchange</div>
                    <p className="text-sm text-gray-600">Get feedback on your manuscripts</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Club Events</div>
                    <p className="text-sm text-gray-600">Join writing sprints and workshops</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Community</div>
                    <p className="text-sm text-gray-600">Network with fellow authors</p>
                  </div>
                </div>
              </div>
              <Button size="lg" className="mt-8" onClick={handleJoinClub} disabled={joining}>
                <UserPlus className="mr-2 h-4 w-4" />
                {joining ? 'Joining...' : 'Join This Club'}
              </Button>
            </CardContent>
          </Card>
        )}

        {isMember && (
          <div className="mt-6 flex justify-end">
            <Button variant="ghost" className="text-red-600" onClick={handleLeaveClub}>
              <LogOut className="mr-2 h-4 w-4" />
              Leave Club
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
