'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { ExternalLink, DollarSign, CreditCard, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface StripeEarningsCardProps {
  stripeCustomerId?: string | null
  stripeConnectAccountId?: string | null
  subscriptionStatus?: string | null
  subscriptionTier?: string | null
  subscriptionCurrentPeriodEnd?: string | null
  stripeConnectOnboarded?: boolean
  stripeConnectChargesEnabled?: boolean
  stripeConnectPayoutsEnabled?: boolean
}

export function StripeEarningsCard({
  stripeCustomerId,
  stripeConnectAccountId,
  subscriptionStatus,
  subscriptionTier,
  subscriptionCurrentPeriodEnd,
  stripeConnectOnboarded,
  stripeConnectChargesEnabled,
  stripeConnectPayoutsEnabled,
}: StripeEarningsCardProps) {
  const [loading, setLoading] = useState(false)

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      toast.error('Failed to open Stripe portal')
      setLoading(false)
    }
  }

  const handleManageEarnings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/connect/create-dashboard-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to create dashboard link')
      }

      const { url } = await response.json()
      window.open(url, '_blank')
      setLoading(false)
    } catch (error) {
      toast.error('Failed to open Stripe dashboard')
      setLoading(false)
    }
  }

  const getSubscriptionStatusBadge = (status?: string | null) => {
    if (!status) return null

    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trialing: 'secondary',
      past_due: 'destructive',
      canceled: 'outline',
      unpaid: 'destructive',
    }

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTier = (tier?: string | null) => {
    if (!tier) return 'Free'
    // Handle price IDs like "price_xxx" or actual tier names
    if (tier.startsWith('price_')) return 'Premium'
    return tier.charAt(0).toUpperCase() + tier.slice(1)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Subscription Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <CardDescription>Your current plan and billing</CardDescription>
          </div>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan:</span>
              <span className="font-medium">{formatTier(subscriptionTier)}</span>
            </div>
            {subscriptionStatus && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                {getSubscriptionStatusBadge(subscriptionStatus)}
              </div>
            )}
            {subscriptionCurrentPeriodEnd && subscriptionStatus === 'active' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Renews:</span>
                <span className="text-sm">{formatDate(subscriptionCurrentPeriodEnd)}</span>
              </div>
            )}
            <Button
              onClick={handleManageSubscription}
              disabled={loading || !stripeCustomerId}
              className="w-full mt-2"
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage in Stripe
            </Button>
            {!stripeCustomerId && (
              <p className="text-xs text-muted-foreground text-center">
                Subscribe to a plan to manage billing
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Earnings Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
            <CardDescription>Your writer earnings and payouts</CardDescription>
          </div>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stripeConnectAccountId ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account Status:</span>
                  <Badge variant={stripeConnectOnboarded ? 'default' : 'secondary'}>
                    {stripeConnectOnboarded ? 'Active' : 'Setup Required'}
                  </Badge>
                </div>
                {stripeConnectOnboarded && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Charges:</span>
                      <Badge variant={stripeConnectChargesEnabled ? 'default' : 'outline'}>
                        {stripeConnectChargesEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Payouts:</span>
                      <Badge variant={stripeConnectPayoutsEnabled ? 'default' : 'outline'}>
                        {stripeConnectPayoutsEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </>
                )}
                <Button
                  onClick={handleManageEarnings}
                  disabled={loading}
                  className="w-full mt-2"
                  variant="outline"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  View Earnings in Stripe
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Set up your writer account to receive payments
                </p>
                <Button
                  onClick={() => (window.location.href = '/connect/onboarding')}
                  variant="default"
                  className="w-full"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Set Up Earnings
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
