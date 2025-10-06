'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Progress } from '@/src/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import {
  Zap,
  Users,
  Target,
  Trophy,
  Clock,
  Play,
  Pause,
  Check,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { formatDistanceToNow, differenceInSeconds } from 'date-fns'
import { toast } from 'react-hot-toast'
import { dbService } from '@/src/lib/database'

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
}

interface Participant {
  id: string
  user_id: string
  name: string
  avatar_url?: string
  starting_word_count: number
  current_word_count: number
  words_written: number
  rank?: number
}

interface SprintRoomProps {
  sprint: Sprint
  clubId: string
  userId: string
  onLeave?: () => void
}

export function SprintRoom({ sprint, clubId, userId, onLeave }: SprintRoomProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isParticipant, setIsParticipant] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [startingCount, setStartingCount] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadParticipants()
    checkParticipation()

    // Subscribe to real-time updates
    const supabase = dbService.getSupabaseClient()
    const channel = supabase
      .channel(`sprint:${sprint.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sprint_participants',
          filter: `sprint_id=eq.${sprint.id}`,
        },
        () => {
          loadParticipants()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [sprint.id])

  useEffect(() => {
    // Update countdown timer
    const updateTimer = () => {
      const now = new Date()
      const end = new Date(sprint.end_time)
      const seconds = differenceInSeconds(end, now)
      setTimeRemaining(Math.max(0, seconds))
    }

    updateTimer()
    timerRef.current = setInterval(updateTimer, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [sprint.end_time])

  const loadParticipants = async () => {
    try {
      const response = await fetch(`/api/book-clubs/${clubId}/sprints/${sprint.id}/participants`)
      const data = await response.json()
      setParticipants(data.participants || [])
    } catch (error) {
      console.error('Failed to load participants:', error)
    }
  }

  const checkParticipation = async () => {
    try {
      const response = await fetch(`/api/book-clubs/${clubId}/sprints/${sprint.id}/participation`)
      const data = await response.json()
      if (data.participant) {
        setIsParticipant(true)
        setStartingCount(data.participant.starting_word_count)
        setWordCount(data.participant.current_word_count)
      }
    } catch (error) {
      console.error('Failed to check participation:', error)
    }
  }

  const joinSprint = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/book-clubs/${clubId}/sprints/${sprint.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starting_word_count: wordCount }),
      })

      if (!response.ok) throw new Error('Failed to join sprint')

      setIsParticipant(true)
      setStartingCount(wordCount)
      toast.success('Joined sprint! Start writing!')
      loadParticipants()
    } catch (error: any) {
      toast.error(error.message || 'Failed to join sprint')
    } finally {
      setLoading(false)
    }
  }

  const updateWordCount = async () => {
    if (!isParticipant) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/book-clubs/${clubId}/sprints/${sprint.id}/update-count`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_word_count: wordCount }),
      })

      if (!response.ok) throw new Error('Failed to update word count')

      toast.success('Word count updated!')
      loadParticipants()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update word count')
    } finally {
      setUpdating(false)
    }
  }

  const leaveSprint = async () => {
    try {
      const response = await fetch(`/api/book-clubs/${clubId}/sprints/${sprint.id}/leave`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to leave sprint')

      setIsParticipant(false)
      setWordCount(0)
      setStartingCount(0)
      toast.success('Left sprint')
      onLeave?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave sprint')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const myStats = participants.find(p => p.user_id === userId)
  const wordsWritten = wordCount - startingCount
  const progress = sprint.word_count_goal ? (wordsWritten / sprint.word_count_goal) * 100 : 0

  const isActive = sprint.status === 'active'
  const isCompleted = sprint.status === 'completed'
  const canJoin = sprint.status !== 'completed' && !isParticipant

  return (
    <div className="space-y-6">
      {/* Sprint Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{sprint.title}</CardTitle>
              {sprint.description && (
                <CardDescription className="mt-2">{sprint.description}</CardDescription>
              )}
            </div>
            <Badge variant={isActive ? 'default' : isCompleted ? 'secondary' : 'outline'}>
              {isActive && <Zap className="mr-1 h-3 w-3" />}
              {sprint.status}
            </Badge>
          </div>

          {/* Sprint Stats */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {isActive
                  ? `${formatTime(timeRemaining)} remaining`
                  : `${sprint.duration_minutes} min`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </span>
            </div>
            {sprint.word_count_goal && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Goal: {sprint.word_count_goal} words</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Word Counter & Actions */}
      {!isCompleted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isParticipant ? 'Your Progress' : 'Join Sprint'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isParticipant ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Current Word Count</Label>
                    <Badge variant="outline">{wordsWritten} words written</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={wordCount}
                      onChange={e => setWordCount(parseInt(e.target.value) || 0)}
                      placeholder="Enter your word count"
                      min={startingCount}
                    />
                    <Button onClick={updateWordCount} disabled={updating}>
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {sprint.word_count_goal && (
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  )}
                </div>

                {myStats && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium">Your Rank: #{myStats.rank || '-'}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={leaveSprint}>
                      Leave Sprint
                    </Button>
                  </div>
                )}
              </>
            ) : canJoin ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startingCount">Starting Word Count</Label>
                  <Input
                    id="startingCount"
                    type="number"
                    value={wordCount}
                    onChange={e => setWordCount(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your current manuscript word count
                  </p>
                </div>
                <Button onClick={joinSprint} disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Zap className="mr-2 h-4 w-4" />
                  Join Sprint
                </Button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Sprint has ended</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Live Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length > 0 ? (
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    participant.user_id === userId ? 'bg-blue-50' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.avatar_url} />
                      <AvatarFallback>
                        {participant.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{participant.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{participant.words_written}</div>
                    <div className="text-xs text-muted-foreground">words</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No participants yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Label({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className="text-sm font-medium" {...props}>
      {children}
    </label>
  )
}
