'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Zap, Calendar, Clock, Users, Target, ChevronRight, Loader2 } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { CreateSprintDialog } from './CreateSprintDialog'
import { SprintRoom } from './SprintRoom'

interface Sprint {
  id: string
  title: string
  description?: string
  duration_minutes: number
  start_time: string
  end_time: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  word_count_goal?: number
  max_participants?: number
  created_by_id: string
  participant_count: number
}

interface SprintListProps {
  clubId: string
  userId: string
}

export function SprintList({ clubId, userId }: SprintListProps) {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const [filter, setFilter] = useState<'upcoming' | 'active' | 'completed'>('upcoming')

  useEffect(() => {
    loadSprints()
  }, [clubId, filter])

  const loadSprints = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/book-clubs/${clubId}/sprints?filter=${filter}`)
      const data = await response.json()
      setSprints(data.sprints || [])
    } catch (error) {
      console.error('Failed to load sprints:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: Sprint['status']) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'scheduled':
        return 'outline'
      case 'completed':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (selectedSprint) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedSprint(null)}>
          ← Back to Sprints
        </Button>
        <SprintRoom
          sprint={selectedSprint}
          clubId={clubId}
          userId={userId}
          onLeave={() => {
            setSelectedSprint(null)
            loadSprints()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Writing Sprints</h2>
          <p className="text-muted-foreground">
            Join focused writing sessions with your club members
          </p>
        </div>
        <CreateSprintDialog clubId={clubId} onSprintCreated={loadSprints} />
      </div>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sprints.length > 0 ? (
            <div className="grid gap-4">
              {sprints.map(sprint => (
                <Card
                  key={sprint.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedSprint(sprint)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{sprint.title}</h3>
                          <Badge variant={getStatusColor(sprint.status)}>
                            {sprint.status === 'active' && <Zap className="mr-1 h-3 w-3" />}
                            {sprint.status}
                          </Badge>
                        </div>

                        {sprint.description && (
                          <p className="text-sm text-muted-foreground mb-3">{sprint.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {sprint.status === 'scheduled'
                                ? `Starts ${formatDistanceToNow(new Date(sprint.start_time), { addSuffix: true })}`
                                : format(new Date(sprint.start_time), 'PPp')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>{sprint.duration_minutes} min</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>
                              {sprint.participant_count} participant
                              {sprint.participant_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {sprint.word_count_goal && (
                            <div className="flex items-center gap-1.5">
                              <Target className="h-4 w-4" />
                              <span>Goal: {sprint.word_count_goal} words</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No {filter} sprints</h3>
                <p className="text-muted-foreground mb-4">
                  {filter === 'upcoming'
                    ? 'Create a sprint to get started!'
                    : `No ${filter} sprints to display`}
                </p>
                {filter === 'upcoming' && (
                  <CreateSprintDialog clubId={clubId} onSprintCreated={loadSprints} />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
