'use client'

import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { MapPin, Book, Users, CheckCircle, Crown, Sparkles, Shield } from 'lucide-react'
import Link from 'next/link'
import { sanitizeText } from '@/src/lib/sanitize'

// Helper function to check if author joined within days
function isWithinDays(dateString: string, days: number): boolean {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= days
}

interface AuthorCardProps {
  name: string
  specialty: string
  location: string
  works: number
  followers: number
  bio: string
  avatar?: string
  tags: string[]
  username?: string
  onFollow?: (e?: React.MouseEvent) => void
  isFollowing?: boolean
  verified?: boolean
  subscriptionTier?: string
  createdAt?: string
  accountType?: string
}

export function AuthorCard({
  name,
  specialty,
  location,
  works,
  followers,
  bio,
  avatar,
  tags,
  username,
  onFollow,
  isFollowing = false,
  verified = false,
  subscriptionTier,
  createdAt,
  accountType,
}: AuthorCardProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')

  // Generate badges
  const badges = []

  // New author badge (joined < 7 days ago)
  if (createdAt && isWithinDays(createdAt, 7)) {
    badges.push({
      label: 'New',
      icon: Sparkles,
      className: 'bg-green-500/10 text-green-600 border-green-500/20',
    })
  }

  // Top Contributor - 100+ followers and 10+ works (highest tier)
  if (followers >= 100 && works >= 10) {
    badges.push({
      label: 'Top Contributor',
      icon: Crown,
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    })
  }
  // Verified - 50+ followers and 5+ works
  else if (followers >= 50 && works >= 5) {
    badges.push({
      label: 'Verified',
      icon: CheckCircle,
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    })
  }
  // Professional account types
  else if (accountType && ['platform_agent', 'external_agent', 'producer'].includes(accountType)) {
    badges.push({
      label: 'Professional',
      icon: Shield,
      className: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    })
  }

  // Premium subscriber badge
  if (subscriptionTier === 'premium' || subscriptionTier === 'pro') {
    badges.push({
      label: 'Premium',
      icon: Crown,
      className: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    })
  }

  return (
    <Card className="card-bg card-shadow hover:shadow-lg transition-all duration-300 border-literary-border">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-literary-subtle text-foreground font-medium text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 mb-2">
              <Link
                href={`/profile/${username || name.toLowerCase().replace(' ', '_')}`}
                className="font-serif text-base sm:text-lg font-semibold hover:underline break-words"
              >
                {name}
              </Link>
              <Button
                variant={isFollowing ? 'default' : 'outline'}
                size="sm"
                className="self-start xs:self-auto text-xs sm:text-sm"
                onClick={e => {
                  e.stopPropagation()
                  onFollow?.(e)
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>

            <p className="text-xs sm:text-sm text-literary-accent font-medium mb-2">{specialty}</p>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                {badges.map((badge, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`text-xs flex items-center gap-1 ${badge.className}`}
                  >
                    <badge.icon className="h-3 w-3" />
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-3">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
              {sanitizeText(bio)}
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <Book className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span>{works} works</span>
              </div>
              <div className="flex items-center">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span>{followers.toLocaleString()} followers</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 sm:gap-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
