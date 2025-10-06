'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Trophy, TrendingUp, Award, Flame } from 'lucide-react'
import Link from 'next/link'

interface LeaderboardEntry {
  user_id: string
  name: string
  avatar_url?: string
  score: number
  rank: number
  change?: number
}

interface LeaderboardProps {
  clubId: string
}

export function Leaderboard({ clubId }: LeaderboardProps) {
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardEntry[]>([])
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly')

  useEffect(() => {
    loadLeaderboard()
  }, [clubId, timeframe])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/book-clubs/${clubId}/leaderboard?timeframe=${timeframe}`)
      const data = await response.json()

      if (timeframe === 'weekly') {
        setWeeklyLeaders(data.leaderboard || [])
      } else {
        setMonthlyLeaders(data.leaderboard || [])
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />
      case 3:
        return <Trophy className="h-5 w-5 text-orange-600" />
      default:
        return <div className="h-5 w-5 flex items-center justify-center text-sm font-bold text-gray-400">#{rank}</div>
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const leaders = timeframe === 'weekly' ? weeklyLeaders : monthlyLeaders

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
        <CardDescription>Top contributors in this club</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)} className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="weekly" className="flex-1">
              This Week
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1">
              This Month
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-3 mt-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : leaders.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No activity this {timeframe === 'weekly' ? 'week' : 'month'} yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaders.map(entry => (
                  <Link
                    key={entry.user_id}
                    href={`/clubs/${clubId}/members/${entry.user_id}`}
                    className="block"
                  >
                    <div
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all hover:shadow-md ${
                        entry.rank <= 3 ? getRankBadge(entry.rank) : 'bg-white border hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getRankIcon(entry.rank)}
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{entry.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className={`font-semibold ${entry.rank <= 3 ? 'text-white' : ''}`}>
                            {entry.name}
                          </div>
                          <div className={`text-sm ${entry.rank <= 3 ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {entry.score} points
                          </div>
                        </div>
                      </div>

                      {entry.change !== undefined && entry.change !== 0 && (
                        <Badge variant={entry.change > 0 ? 'default' : 'secondary'} className="gap-1">
                          {entry.change > 0 ? (
                            <>
                              <TrendingUp className="h-3 w-3" />
                              +{entry.change}
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-3 w-3 rotate-180" />
                              {entry.change}
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-3 mt-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : leaders.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No activity this month yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaders.map(entry => (
                  <Link
                    key={entry.user_id}
                    href={`/clubs/${clubId}/members/${entry.user_id}`}
                    className="block"
                  >
                    <div
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all hover:shadow-md ${
                        entry.rank <= 3 ? getRankBadge(entry.rank) : 'bg-white border hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getRankIcon(entry.rank)}
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{entry.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className={`font-semibold ${entry.rank <= 3 ? 'text-white' : ''}`}>
                            {entry.name}
                          </div>
                          <div className={`text-sm ${entry.rank <= 3 ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {entry.score} points
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            How Points Work
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>• Start discussion: 5 points</div>
            <div>• Reply to discussion: 2 points</div>
            <div>• Give critique: 10 points</div>
            <div>• Helpful critique: 15 points</div>
            <div>• Create event: 5 points</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
