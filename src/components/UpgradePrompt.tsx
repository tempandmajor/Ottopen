'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Crown, ArrowRight, Zap, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { AccountTier } from '@/src/lib/feature-gates'
import { getTierDisplayName, getTierBadgeColor } from '@/src/lib/feature-gates'

interface UpgradePromptProps {
  currentTier: AccountTier
  requiredTier: AccountTier
  feature: string
  message?: string
  className?: string
}

export function UpgradePrompt({
  currentTier,
  requiredTier,
  feature,
  message,
  className = '',
}: UpgradePromptProps) {
  const router = useRouter()

  const tierName = getTierDisplayName(requiredTier)
  const badgeColor = getTierBadgeColor(requiredTier)

  return (
    <Card className={`border-2 border-dashed ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-400" />
              <Badge className={badgeColor}>{tierName} Feature</Badge>
            </div>
            <CardTitle className="text-xl">Unlock {feature}</CardTitle>
            <CardDescription className="mt-2">
              {message || `This feature requires ${tierName} tier or higher`}
            </CardDescription>
          </div>
          <Crown className="h-8 w-8 text-yellow-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/pricing')} className="gap-2">
            <Zap className="h-4 w-4" />
            Upgrade to {tierName}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => router.push('/pricing')}>
            View All Plans
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface FeatureLockedOverlayProps {
  requiredTier: AccountTier
  feature: string
  message?: string
  children: React.ReactNode
}

export function FeatureLockedOverlay({
  requiredTier,
  feature,
  message,
  children,
}: FeatureLockedOverlayProps) {
  const router = useRouter()
  const tierName = getTierDisplayName(requiredTier)

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="pointer-events-none select-none blur-sm">{children}</div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <Card className="mx-4 max-w-md border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle>{feature} Locked</CardTitle>
            <CardDescription>
              {message || `Upgrade to ${tierName} to unlock this feature`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => router.push('/pricing')} className="w-full gap-2">
              <Crown className="h-4 w-4" />
              Upgrade to {tierName}
            </Button>
            <Button variant="outline" onClick={() => router.push('/pricing')} className="w-full">
              View Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
