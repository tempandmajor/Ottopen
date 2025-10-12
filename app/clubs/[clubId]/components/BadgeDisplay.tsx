'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { Award, Star, Target, MessageSquare, TrendingUp, Lock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface UserBadge {
  id: string
  badge_type: string
  badge_name: string
  badge_description: string
  earned_at: string
}

interface BadgeProgress {
  badge_name: string
  badge_description: string
  current: number
  required: number
  icon: string
}

interface BadgeDisplayProps {
  clubId: string
  userId: string
  compact?: boolean
}

const BADGE_ICONS: Record<string, any> = {
  first_critique: Star,
  bookworm: Award,
  eagle_eye: Target,
  discussion_leader: MessageSquare,
  week_streak: TrendingUp,
  top_contributor: Award,
}

export function BadgeDisplay({ clubId, userId, compact = false }: BadgeDisplayProps) {
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [progress, setProgress] = useState<BadgeProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBadges()
  }, [clubId, userId])

  const loadBadges = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/book-clubs/${clubId}/badges/${userId}`)
      const data = await response.json()
      setBadges(data.badges || [])
      setProgress(data.progress || [])
    } catch (error) {
      console.error('Failed to load badges:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBadgeIcon = (badgeType: string) => {
    const Icon = BADGE_ICONS[badgeType] || Award
    return Icon
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {badges.slice(0, 3).map(badge => {
          const Icon = getBadgeIcon(badge.badge_type)
          return (
            <div
              key={badge.id}
              className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs"
              title={badge.badge_description}
            >
              <Icon className="h-3 w-3" />
              <span>{badge.badge_name}</span>
            </div>
          )
        })}
        {badges.length > 3 && <Badge variant="secondary">+{badges.length - 3} more</Badge>}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
        <CardDescription>Badges earned through club participation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            {/* Earned Badges */}
            {badges.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Earned Badges ({badges.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {badges.map(badge => {
                    const Icon = getBadgeIcon(badge.badge_type)
                    return (
                      <div
                        key={badge.id}
                        className="flex items-start gap-3 p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200"
                      >
                        <div className="p-2 bg-purple-500 rounded-full">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-purple-900">{badge.badge_name}</div>
                          <div className="text-sm text-purple-700">{badge.badge_description}</div>
                          <div className="text-xs text-purple-600 mt-1">
                            Earned{' '}
                            {formatDistanceToNow(new Date(badge.earned_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No badges earned yet. Start participating to earn achievements!</p>
              </div>
            )}

            {/* Badge Progress */}
            {progress.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">In Progress</h4>
                {progress.map((item, index) => {
                  const percentage = Math.min((item.current / item.required) * 100, 100)
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-sm">{item.badge_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.current}/{item.required}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">{item.badge_description}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Available Badges */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Available Badges</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>🌟 First Critique</div>
                <div>📚 Bookworm (10 critiques)</div>
                <div>🎯 Eagle Eye (5 helpful)</div>
                <div>💬 Discussion Leader (10)</div>
                <div>🔥 Week Streak</div>
                <div>👑 Top Contributor</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
