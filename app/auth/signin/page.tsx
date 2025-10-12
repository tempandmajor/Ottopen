'use client'

import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { PenTool, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/src/contexts/auth-context'
import { useNavigate } from '@/src/hooks/use-navigate'
import { useRateLimit } from '@/src/hooks/use-rate-limit'
import { toast } from 'react-hot-toast'
import { GoogleOAuthButton } from '@/src/components/auth/google-oauth-button'
import * as Sentry from '@sentry/nextjs'

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const { signIn, user, loading } = useAuth()
  const navigate = useNavigate()

  // Rate limiting for signin attempts
  const rateLimiter = useRateLimit({
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
    storageKey: 'signin-rate-limit',
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !redirecting) {
      console.log('SignIn: User authenticated, redirecting to feed')
      setRedirecting(true)
      // Use window.location for immediate redirect
      window.location.href = '/feed'
    }
  }, [user, redirecting])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    // Check rate limiting
    if (!rateLimiter.canAttempt) {
      toast.error(
        `Too many attempts. Please wait ${rateLimiter.remainingTime} seconds before trying again.`
      )
      return
    }

    console.log('=== SIGNIN FORM SUBMIT ===')
    setSubmitting(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const result = await signIn(normalizedEmail, password)
      console.log('SignIn result:', result)

      if (result.success) {
        console.log('SignIn successful - will redirect after auth state updates')
        toast.success('Signed in successfully!')

        // Reset rate limiter on success
        rateLimiter.recordAttempt(true)

        // Don't redirect here - let the useEffect handle it when user state is set
        // The auth context will update and trigger the redirect in useEffect
      } else {
        console.log('SignIn failed:', result.error)
        toast.error(result.error || 'Sign in failed')

        // Record failed attempt
        rateLimiter.recordAttempt(false)
      }
    } catch (error) {
      console.error('SignIn form error:', error)
      Sentry.captureException(error)
      toast.error('An unexpected error occurred')

      // Record failed attempt
      rateLimiter.recordAttempt(false)
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <PenTool className="h-8 w-8" />
            <h1 className="font-serif text-2xl font-semibold">Ottopen</h1>
          </Link>
          <p className="text-muted-foreground">Welcome back to the literary community</p>
        </div>

        {/* Sign In Form */}
        <Card className="card-bg card-shadow border-literary-border">
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google OAuth Button */}
            <GoogleOAuthButton mode="signin" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-literary-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="border-literary-border"
                  data-testid="email-input"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="border-literary-border pr-10"
                    data-testid="password-input"
                    required
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={submitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                data-testid="signin-button"
                disabled={submitting || !rateLimiter.canAttempt}
              >
                {submitting
                  ? 'Signing in...'
                  : !rateLimiter.canAttempt
                    ? `Wait ${rateLimiter.remainingTime}s`
                    : 'Sign In'}
              </Button>

              {/* Rate limit feedback */}
              {rateLimiter.attemptCount > 0 && rateLimiter.canAttempt && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {rateLimiter.attemptsRemaining} attempts remaining
                </p>
              )}

              {!rateLimiter.canAttempt && (
                <p className="text-xs text-destructive text-center mt-2">
                  Too many failed attempts. Please wait {rateLimiter.remainingTime} seconds.
                </p>
              )}
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don&apos;t have an account? </span>
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            By continuing, you agree to our{' '}
            <Link href="/legal/terms" className="hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy" className="hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
