'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  getAuthMetrics,
  getSecurityAlerts,
  getAuthEvents,
  exportAuthData,
} from '@/src/lib/auth-monitoring'
import { AlertTriangle, Shield, Users, Activity } from 'lucide-react'

export function AuthMonitoringDashboard() {
  const [metrics, setMetrics] = useState(getAuthMetrics())
  const [alerts, setAlerts] = useState(getSecurityAlerts())
  const [recentEvents, setRecentEvents] = useState(getAuthEvents(10))

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getAuthMetrics())
      setAlerts(getSecurityAlerts())
      setRecentEvents(getAuthEvents(10))
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const exportData = () => {
    const data = exportAuthData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auth-monitoring-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const successRate =
    metrics.signInAttempts > 0
      ? ((metrics.signInSuccesses / metrics.signInAttempts) * 100).toFixed(1)
      : '0'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Authentication Monitoring</h1>
        <Button onClick={exportData} variant="outline">
          Export Data
        </Button>
      </div>

      {/* Security Alerts */}
      {alerts.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Security Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{alert.message}</span>
                  <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sign-in Success Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.signInSuccesses}/{metrics.signInAttempts} attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sign-up Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.signUpAttempts}</div>
            <p className="text-xs text-muted-foreground">{metrics.signUpSuccesses} successful</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limit Hits</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rateLimitHits}</div>
            <p className="text-xs text-muted-foreground">Security protection active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Timeouts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.sessionTimeouts}</div>
            <p className="text-xs text-muted-foreground">Idle session management</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Authentication Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent events</p>
            ) : (
              recentEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{event.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {event.email && `${event.email} • `}
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  {event.metadata?.error && (
                    <Badge variant="destructive" className="text-xs">
                      Error
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
