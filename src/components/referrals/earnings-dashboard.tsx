'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { DollarSign, TrendingUp, Clock, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { ReferralEarning, PayoutRequest, ReferralBalance } from '@/src/lib/supabase'

interface EarningsDashboardProps {
  userId: string
}

export function EarningsDashboard({ userId }: EarningsDashboardProps) {
  const [balance, setBalance] = useState<ReferralBalance>({
    total_earned_cents: 0,
    available_cents: 0,
    pending_cents: 0,
    paid_cents: 0,
  })
  const [earnings, setEarnings] = useState<ReferralEarning[]>([])
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [connectStatus, setConnectStatus] = useState({
    connected: false,
    onboarded: false,
    payouts_enabled: false,
  })
  const [loading, setLoading] = useState(true)
  const [requestingPayout, setRequestingPayout] = useState(false)

  const MINIMUM_PAYOUT = 10 // $10

  useEffect(() => {
    fetchEarnings()
    fetchConnectStatus()
  }, [])

  const fetchEarnings = async () => {
    try {
      const response = await fetch('/api/referrals/earnings')
      if (response.ok) {
        const data = await response.json()
        setBalance(data.balance)
        setEarnings(data.earnings)
        setPayouts(data.payouts)
      }
    } catch (error) {
      console.error('Error fetching earnings:', error)
      toast.error('Failed to load earnings')
    } finally {
      setLoading(false)
    }
  }

  const fetchConnectStatus = async () => {
    try {
      const response = await fetch('/api/stripe/connect/status')
      if (response.ok) {
        const data = await response.json()
        setConnectStatus(data)
      }
    } catch (error) {
      console.error('Error fetching Connect status:', error)
    }
  }

  const handleConnectOnboarding = async () => {
    try {
      const response = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.url
      } else {
        toast.error('Failed to start onboarding')
      }
    } catch (error) {
      console.error('Error starting onboarding:', error)
      toast.error('Failed to start onboarding')
    }
  }

  const handleRequestPayout = async () => {
    if (balance.available_cents < MINIMUM_PAYOUT * 100) {
      toast.error(`Minimum payout is $${MINIMUM_PAYOUT}`)
      return
    }

    if (!connectStatus.payouts_enabled) {
      toast.error('Please complete Stripe Connect onboarding first')
      return
    }

    setRequestingPayout(true)
    try {
      const response = await fetch('/api/referrals/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: balance.available_cents,
        }),
      })

      if (response.ok) {
        toast.success('Payout requested successfully!')
        fetchEarnings()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to request payout')
      }
    } catch (error) {
      console.error('Error requesting payout:', error)
      toast.error('Failed to request payout')
    } finally {
      setRequestingPayout(false)
    }
  }

  const handleViewDashboard = async () => {
    try {
      const response = await fetch('/api/stripe/connect/dashboard', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        window.open(data.url, '_blank')
      } else {
        toast.error('Failed to open dashboard')
      }
    } catch (error) {
      console.error('Error opening dashboard:', error)
      toast.error('Failed to open dashboard')
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance.total_earned_cents)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(balance.available_cents)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(balance.pending_cents)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(balance.paid_cents)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connect Status & Payout */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Settings</CardTitle>
          <CardDescription>Manage your earnings and request payouts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!connectStatus.onboarded ? (
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                  Complete Stripe Connect Setup
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  To receive payouts, you need to complete your Stripe Connect onboarding.
                </p>
                <Button onClick={handleConnectOnboarding} className="mt-3">
                  Start Onboarding
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Stripe Connect Status</p>
                  <p className="text-sm text-muted-foreground">
                    {connectStatus.payouts_enabled ? '✓ Payouts enabled' : '⏳ Pending activation'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleViewDashboard}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Dashboard
                </Button>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Request Payout</p>
                    <p className="text-sm text-muted-foreground">
                      Minimum: ${MINIMUM_PAYOUT} • Available:{' '}
                      {formatCurrency(balance.available_cents)}
                    </p>
                  </div>
                  <Button
                    onClick={handleRequestPayout}
                    disabled={
                      requestingPayout ||
                      balance.available_cents < MINIMUM_PAYOUT * 100 ||
                      !connectStatus.payouts_enabled
                    }
                  >
                    {requestingPayout ? 'Processing...' : 'Request Payout'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings History */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No earnings yet</p>
          ) : (
            <div className="space-y-3">
              {earnings.map(earning => (
                <div
                  key={earning.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        earning.status === 'paid'
                          ? 'bg-blue-500'
                          : earning.status === 'available'
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium">
                        {earning.referral?.referred?.display_name || 'Unknown user'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(earning.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(earning.amount_cents)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{earning.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      {payouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payouts.map(payout => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{formatCurrency(payout.amount_cents)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payout.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payout.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : payout.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {payout.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
