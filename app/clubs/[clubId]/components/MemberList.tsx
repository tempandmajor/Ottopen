'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import {
  Search,
  Grid,
  List,
  UserPlus,
  Users as UsersIcon,
  Award,
  MessageSquare,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Member {
  id: string
  user_id: string
  name: string
  avatar_url?: string
  role: 'owner' | 'moderator' | 'member'
  credits: number
  joined_at: string
  stats: {
    discussions: number
    critiques_given: number
    critiques_received: number
  }
  is_following?: boolean
}

interface MemberListProps {
  clubId: string
  currentUserId: string
}

export function MemberList({ clubId, currentUserId }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'recent' | 'active' | 'credits'>('recent')

  useEffect(() => {
    loadMembers()
  }, [clubId, sortBy])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ sortBy })
      const response = await fetch(`/api/book-clubs/${clubId}/members?${params}`)
      const data = await response.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error('Failed to load members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      const response = await fetch(`/api/book-clubs/${clubId}/members/${userId}/follow`, {
        method: 'POST',
      })
      if (response.ok) {
        loadMembers()
      }
    } catch (error) {
      console.error('Failed to follow:', error)
    }
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeColor = (role: Member['role']) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800'
      case 'moderator':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Joined</SelectItem>
            <SelectItem value="active">Most Active</SelectItem>
            <SelectItem value="credits">Top Credits</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No members found</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map(member => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/clubs/${clubId}/members/${member.user_id}`}>
                        <h4 className="font-semibold hover:underline">{member.name}</h4>
                      </Link>
                      <Badge className={getRoleBadgeColor(member.role)}>{member.role}</Badge>
                    </div>
                  </div>
                  {member.user_id !== currentUserId && (
                    <Button
                      size="sm"
                      variant={member.is_following ? 'outline' : 'default'}
                      onClick={() => handleFollow(member.user_id)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Credits</span>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{member.credits}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Discussions</span>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{member.stats.discussions}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Critiques Given</span>
                    <span>{member.stats.critiques_given}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map(member => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/clubs/${clubId}/members/${member.user_id}`}>
                          <h4 className="font-semibold hover:underline">{member.name}</h4>
                        </Link>
                        <Badge className={getRoleBadgeColor(member.role)} variant="outline">
                          {member.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {member.credits} credits
                        </span>
                        <span>{member.stats.discussions} discussions</span>
                        <span>{member.stats.critiques_given} critiques</span>
                        <span>
                          Joined{' '}
                          {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {member.user_id !== currentUserId && (
                    <Button
                      size="sm"
                      variant={member.is_following ? 'outline' : 'default'}
                      onClick={() => handleFollow(member.user_id)}
                    >
                      {member.is_following ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
