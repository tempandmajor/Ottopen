'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { MessageSquare, BookOpen, Calendar, UserPlus, Award, TrendingUp, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Activity {
  id: string
  activity_type: string
  content: any
  user: {
    id: string
    name: string
    avatar_url?: string
  }
  created_at: string
}

interface ActivityFeedProps {
  clubId: string
}

const ACTIVITY_ICONS: Record<string, any> = {
  discussion_created: MessageSquare,
  discussion_reply: MessageSquare,
  critique_submitted: BookOpen,
  critique_received: BookOpen,
  event_created: Calendar,
  member_joined: UserPlus,
  badge_earned: Award,
  milestone_reached: TrendingUp,
}

const ACTIVITY_COLORS: Record<string, string> = {
  discussion_created: 'text-blue-600 bg-blue-100',
  discussion_reply: 'text-blue-500 bg-blue-50',
  critique_submitted: 'text-purple-600 bg-purple-100',
  critique_received: 'text-purple-500 bg-purple-50',
  event_created: 'text-green-600 bg-green-100',
  member_joined: 'text-indigo-600 bg-indigo-100',
  badge_earned: 'text-yellow-600 bg-yellow-100',
  milestone_reached: 'text-orange-600 bg-orange-100',
}

export function ActivityFeed({ clubId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'discussions' | 'critiques' | 'events'>('all')

  useEffect(() => {
    loadActivities()
  }, [clubId, filter])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ filter })
      const response = await fetch(`/api/book-clubs/${clubId}/activity?${params}`)
      const data = await response.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    const Icon = ACTIVITY_ICONS[type] || Users
    return Icon
  }

  const getActivityMessage = (activity: Activity) => {
    const { activity_type, content, user } = activity

    switch (activity_type) {
      case 'discussion_created':
        return (
          <>
            <span className="font-semibold">{user.name}</span> started a discussion:{' '}
            <Link
              href={`/clubs/${clubId}/discussions/${content.discussion_id}`}
              className="text-blue-600 hover:underline"
            >
              {content.title}
            </Link>
          </>
        )
      case 'discussion_reply':
        return (
          <>
            <span className="font-semibold">{user.name}</span> replied to:{' '}
            <Link
              href={`/clubs/${clubId}/discussions/${content.discussion_id}`}
              className="text-blue-600 hover:underline"
            >
              {content.title}
            </Link>
          </>
        )
      case 'critique_submitted':
        return (
          <>
            <span className="font-semibold">{user.name}</span> submitted work for critique:{' '}
            <Link
              href={`/clubs/${clubId}/critiques/${content.critique_id}`}
              className="text-purple-600 hover:underline"
            >
              {content.title}
            </Link>
          </>
        )
      case 'critique_received':
        return (
          <>
            <span className="font-semibold">{user.name}</span> gave a critique on:{' '}
            <Link
              href={`/clubs/${clubId}/critiques/${content.critique_id}`}
              className="text-purple-600 hover:underline"
            >
              {content.title}
            </Link>
          </>
        )
      case 'event_created':
        return (
          <>
            <span className="font-semibold">{user.name}</span> created an event:{' '}
            <span className="font-medium">{content.title}</span>
          </>
        )
      case 'member_joined':
        return (
          <>
            <span className="font-semibold">{user.name}</span> joined the club
          </>
        )
      case 'badge_earned':
        return (
          <>
            <span className="font-semibold">{user.name}</span> earned the{' '}
            <span className="font-medium">{content.badge_name}</span> badge
          </>
        )
      case 'milestone_reached':
        return (
          <>
            <span className="font-semibold">{user.name}</span> reached a milestone:{' '}
            <span className="font-medium">{content.milestone}</span>
          </>
        )
      default:
        return (
          <>
            <span className="font-semibold">{user.name}</span> {content.message || 'did something'}
          </>
        )
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
        <CardDescription>Recent club activity and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={v => setFilter(v as any)} className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All Activity
            </TabsTrigger>
            <TabsTrigger value="discussions" className="flex-1">
              Discussions
            </TabsTrigger>
            <TabsTrigger value="critiques" className="flex-1">
              Critiques
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1">
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-3 mt-4">
            {activities.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {activities.map(activity => {
                  const Icon = getActivityIcon(activity.activity_type)
                  const colorClass =
                    ACTIVITY_COLORS[activity.activity_type] || 'text-gray-600 bg-gray-100'

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{getActivityMessage(activity)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
