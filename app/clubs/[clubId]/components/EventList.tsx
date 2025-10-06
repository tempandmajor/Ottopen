'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Calendar as CalendarIcon, Clock, MapPin, Users, Video } from 'lucide-react'
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns'
import { CreateEventDialog } from './CreateEventDialog'

interface Event {
  id: string
  title: string
  description: string
  event_type: 'writing_sprint' | 'workshop' | 'reading' | 'social' | 'other'
  start_time: string
  end_time: string
  location_type: 'virtual' | 'in_person'
  location_details?: string
  max_participants?: number
  rsvp_count: number
  user_rsvp?: boolean
  created_by: {
    id: string
    name: string
  }
}

interface EventListProps {
  clubId: string
  userId: string
  isMember: boolean
}

export function EventList({ clubId, userId, isMember }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    loadEvents()
  }, [clubId, filter])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ filter })
      const response = await fetch(`/api/book-clubs/${clubId}/events?${params}`)
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRSVP = async (eventId: string) => {
    try {
      const response = await fetch(`/api/book-clubs/${clubId}/events/${eventId}/rsvp`, {
        method: 'POST',
      })
      if (response.ok) {
        loadEvents()
      }
    } catch (error) {
      console.error('Failed to RSVP:', error)
    }
  }

  const getEventTypeColor = (type: Event['event_type']) => {
    switch (type) {
      case 'writing_sprint':
        return 'bg-blue-100 text-blue-800'
      case 'workshop':
        return 'bg-purple-100 text-purple-800'
      case 'reading':
        return 'bg-green-100 text-green-800'
      case 'social':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEventTypeLabel = (type: Event['event_type']) => {
    switch (type) {
      case 'writing_sprint':
        return 'Writing Sprint'
      case 'workshop':
        return 'Workshop'
      case 'reading':
        return 'Reading'
      case 'social':
        return 'Social'
      default:
        return 'Other'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </Button>
          <Button
            variant={filter === 'past' ? 'default' : 'outline'}
            onClick={() => setFilter('past')}
          >
            Past
          </Button>
        </div>
        {isMember && <Button onClick={() => setShowCreateDialog(true)}>Create Event</Button>}
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {filter === 'upcoming' ? 'No upcoming events' : 'No past events'}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'upcoming' && isMember && 'Be the first to create an event!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getEventTypeColor(event.event_type)}>
                        {getEventTypeLabel(event.event_type)}
                      </Badge>
                      {event.location_type === 'virtual' && (
                        <Badge variant="outline">
                          <Video className="h-3 w-3 mr-1" />
                          Virtual
                        </Badge>
                      )}
                      {event.max_participants && event.rsvp_count >= event.max_participants && (
                        <Badge variant="destructive">Full</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mb-1">{event.title}</CardTitle>
                    <CardDescription>
                      Hosted by {event.created_by.id === userId ? 'You' : event.created_by.name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{event.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{format(new Date(event.start_time), 'PPP')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(event.start_time), 'p')} -{' '}
                      {format(new Date(event.end_time), 'p')}
                    </span>
                  </div>
                  {event.location_details && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location_details}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {event.rsvp_count}
                      {event.max_participants && `/${event.max_participants}`} attending
                    </span>
                  </div>
                </div>

                {isMember && isFuture(new Date(event.start_time)) && (
                  <div className="flex justify-end">
                    <Button
                      variant={event.user_rsvp ? 'outline' : 'default'}
                      onClick={() => handleRSVP(event.id)}
                      disabled={
                        !event.user_rsvp &&
                        event.max_participants !== null &&
                        event.max_participants !== undefined &&
                        event.rsvp_count >= event.max_participants
                      }
                    >
                      {event.user_rsvp ? 'Cancel RSVP' : 'RSVP'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateEventDialog
        clubId={clubId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onEventCreated={() => {
          setShowCreateDialog(false)
          loadEvents()
        }}
      />
    </div>
  )
}
