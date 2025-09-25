interface AuthEvent {
  type: string
  userId?: string
  email?: string
  timestamp: number
  metadata?: Record<string, any>
  clientInfo?: {
    userAgent: string
    ip?: string
    location?: string
  }
}

interface AuthMetrics {
  signInAttempts: number
  signInSuccesses: number
  signInFailures: number
  signUpAttempts: number
  signUpSuccesses: number
  signUpFailures: number
  passwordResetRequests: number
  sessionTimeouts: number
  rateLimitHits: number
  lastActivity: number
}

class AuthMonitor {
  private events: AuthEvent[] = []
  private metrics: AuthMetrics = {
    signInAttempts: 0,
    signInSuccesses: 0,
    signInFailures: 0,
    signUpAttempts: 0,
    signUpSuccesses: 0,
    signUpFailures: 0,
    passwordResetRequests: 0,
    sessionTimeouts: 0,
    rateLimitHits: 0,
    lastActivity: Date.now(),
  }

  private maxEvents = 1000 // Keep last 1000 events in memory

  private getClientInfo() {
    if (typeof window === 'undefined') return undefined

    return {
      userAgent: navigator.userAgent,
      // IP and location would be determined server-side
    }
  }

  logEvent(type: string, data?: Partial<AuthEvent>) {
    const event: AuthEvent = {
      type,
      timestamp: Date.now(),
      clientInfo: this.getClientInfo(),
      ...data,
    }

    // Add to events array, keeping only the most recent
    this.events.push(event)
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }

    // Update metrics
    this.updateMetrics(event)

    // Log to console for development (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth Event:', event)
    }

    // In production, you might send this to your analytics service
    // this.sendToAnalytics(event)
  }

  private updateMetrics(event: AuthEvent) {
    this.metrics.lastActivity = event.timestamp

    switch (event.type) {
      case 'signin_attempt':
        this.metrics.signInAttempts++
        break
      case 'signin_success':
        this.metrics.signInSuccesses++
        break
      case 'signin_failure':
        this.metrics.signInFailures++
        break
      case 'signup_attempt':
        this.metrics.signUpAttempts++
        break
      case 'signup_success':
        this.metrics.signUpSuccesses++
        break
      case 'signup_failure':
        this.metrics.signUpFailures++
        break
      case 'password_reset_request':
        this.metrics.passwordResetRequests++
        break
      case 'session_timeout':
        this.metrics.sessionTimeouts++
        break
      case 'rate_limit_hit':
        this.metrics.rateLimitHits++
        break
    }
  }

  getMetrics(): AuthMetrics {
    return { ...this.metrics }
  }

  getRecentEvents(limit = 50): AuthEvent[] {
    return this.events.slice(-limit)
  }

  getEventsByType(type: string, limit = 50): AuthEvent[] {
    return this.events
      .filter(event => event.type === type)
      .slice(-limit)
  }

  getFailureRate(): number {
    const totalAttempts = this.metrics.signInAttempts
    if (totalAttempts === 0) return 0
    return (this.metrics.signInFailures / totalAttempts) * 100
  }

  getSecurityAlerts(): Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> {
    const alerts = []

    // High failure rate
    const failureRate = this.getFailureRate()
    if (failureRate > 50 && this.metrics.signInAttempts > 10) {
      alerts.push({
        type: 'high_failure_rate',
        message: `High sign-in failure rate: ${failureRate.toFixed(1)}%`,
        severity: 'high' as const
      })
    }

    // Frequent rate limiting
    if (this.metrics.rateLimitHits > 5) {
      alerts.push({
        type: 'frequent_rate_limiting',
        message: `Frequent rate limit hits: ${this.metrics.rateLimitHits}`,
        severity: 'medium' as const
      })
    }

    // Multiple session timeouts
    if (this.metrics.sessionTimeouts > 3) {
      alerts.push({
        type: 'frequent_timeouts',
        message: `Multiple session timeouts: ${this.metrics.sessionTimeouts}`,
        severity: 'low' as const
      })
    }

    return alerts
  }

  // Method to send data to analytics service (implement as needed)
  private async sendToAnalytics(event: AuthEvent) {
    // Example implementation:
    // await fetch('/api/analytics/auth', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // })
  }

  // Clear sensitive data (useful for user privacy)
  clearUserData(userId: string) {
    this.events = this.events.map(event =>
      event.userId === userId
        ? { ...event, email: undefined, userId: undefined }
        : event
    )
  }

  // Export data for analysis
  exportData() {
    return {
      metrics: this.getMetrics(),
      recentEvents: this.getRecentEvents(100),
      securityAlerts: this.getSecurityAlerts(),
      timestamp: Date.now()
    }
  }
}

// Singleton instance
const authMonitor = new AuthMonitor()

// Convenience functions for easier usage
export const logAuthEvent = (type: string, data?: Partial<AuthEvent>) => {
  authMonitor.logEvent(type, data)
}

export const getAuthMetrics = () => authMonitor.getMetrics()
export const getAuthEvents = (limit?: number) => authMonitor.getRecentEvents(limit)
export const getSecurityAlerts = () => authMonitor.getSecurityAlerts()
export const exportAuthData = () => authMonitor.exportData()

export default authMonitor