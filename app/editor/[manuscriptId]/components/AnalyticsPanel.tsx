'use client'

import { useState, useEffect } from 'react'
import { Manuscript } from '@/src/types/ai-editor'
import { WritingGoalService } from '@/src/lib/ai-editor-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Progress } from '@/src/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { BarChart3, Target, TrendingUp, Clock, Calendar, Award, Zap } from 'lucide-react'
import { formatDistanceToNow, format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

interface AnalyticsPanelProps {
  manuscript: Manuscript
  userId: string
}

interface WritingSession {
  id: string
  words_written: number
  duration_minutes: number
  created_at: string
}

interface DailyStats {
  date: string
  words_written: number
  time_spent_minutes: number
}

export function AnalyticsPanel({ manuscript, userId }: AnalyticsPanelProps) {
  const [sessions, setSessions] = useState<WritingSession[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [manuscript.id])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [sessionsData, statsData] = await Promise.all([
        WritingGoalService.getSessions(userId, manuscript.id),
        WritingGoalService.getDailyStats(userId),
      ])
      setSessions(sessionsData)
      setDailyStats(statsData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const totalWords = manuscript.current_word_count
  const targetWords = manuscript.target_word_count || 80000
  const progressPercentage = Math.min((totalWords / targetWords) * 100, 100)

  const thisWeekSessions = sessions.filter(s => {
    const sessionDate = new Date(s.created_at)
    const weekStart = startOfWeek(new Date())
    const weekEnd = endOfWeek(new Date())
    return sessionDate >= weekStart && sessionDate <= weekEnd
  })

  const thisWeekWords = thisWeekSessions.reduce((sum, s) => sum + s.words_written, 0)
  const thisWeekMinutes = thisWeekSessions.reduce((sum, s) => sum + s.duration_minutes, 0)

  const averageWordsPerSession =
    sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.words_written, 0) / sessions.length)
      : 0

  const averageSessionDuration =
    sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / sessions.length)
      : 0

  const longestSession =
    sessions.length > 0
      ? sessions.reduce(
          (max, s) => (s.duration_minutes > max.duration_minutes ? s : max),
          sessions[0]
        )
      : null

  const mostProductiveDay =
    dailyStats.length > 0
      ? dailyStats.reduce(
          (max, d) => (d.words_written > max.words_written ? d : max),
          dailyStats[0]
        )
      : null

  // Get current week's daily breakdown
  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date()),
  })

  const weeklyBreakdown = weekDays.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayStat = dailyStats.find(s => s.date === dayStr)
    return {
      day: format(day, 'EEE'),
      words: dayStat?.words_written || 0,
      minutes: dayStat?.time_spent_minutes || 0,
    }
  })

  const maxWordsThisWeek = Math.max(...weeklyBreakdown.map(d => d.words), 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Writing Analytics</h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Manuscript Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Manuscript Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{totalWords.toLocaleString()} words</span>
                  <span className="text-muted-foreground">
                    {targetWords.toLocaleString()} target
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  {progressPercentage.toFixed(1)}% complete
                  {targetWords > totalWords && (
                    <> • {(targetWords - totalWords).toLocaleString()} words to go</>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold capitalize">{manuscript.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Genre</p>
                  <p className="text-lg font-semibold capitalize">
                    {manuscript.genre || 'Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Week */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                This Week
              </CardTitle>
              <CardDescription>
                {format(startOfWeek(new Date()), 'MMM d')} -{' '}
                {format(endOfWeek(new Date()), 'MMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Words Written</p>
                  <p className="text-2xl font-bold">{thisWeekWords.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Writing Time</p>
                  <p className="text-2xl font-bold">
                    {Math.round(thisWeekMinutes / 60)}h {thisWeekMinutes % 60}m
                  </p>
                </div>
              </div>

              {/* Daily Breakdown */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Daily Breakdown</p>
                {weeklyBreakdown.map((day, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{day.day}</span>
                      <span>{day.words.toLocaleString()} words</span>
                    </div>
                    <Progress value={(day.words / maxWordsThisWeek) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Session Statistics
              </CardTitle>
              <CardDescription>{sessions.length} writing sessions tracked</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Words/Session</p>
                  <p className="text-2xl font-bold">{averageWordsPerSession.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">{averageSessionDuration} min</p>
                </div>
              </div>

              {longestSession && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Longest Session</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{longestSession.duration_minutes} minutes</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(longestSession.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          {mostProductiveDay && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Zap className="h-5 w-5 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Most Productive Day</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(mostProductiveDay.date), 'MMMM d, yyyy')} •{' '}
                      {mostProductiveDay.words_written.toLocaleString()} words
                    </p>
                  </div>
                </div>

                {thisWeekWords >= 10000 && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Weekly Streak</p>
                      <p className="text-sm text-muted-foreground">10,000+ words this week!</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.slice(0, 5).map(session => (
                    <div
                      key={session.id}
                      className="flex justify-between items-center pb-3 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {session.words_written.toLocaleString()} words
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {session.duration_minutes} min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
