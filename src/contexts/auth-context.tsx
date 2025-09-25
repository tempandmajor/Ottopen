'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase'
import type { User } from '@/src/lib/supabase'
import { useIdleTimeout } from '@/src/hooks/use-idle-timeout'
import { SessionTimeoutWarning } from '@/src/components/auth/session-timeout-warning'
import { logAuthEvent } from '@/src/lib/auth-monitoring'
import { dbService } from '@/src/lib/database'

interface AuthContextType {
  user: (SupabaseUser & { profile?: User }) | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (data: {
    email: string
    password: string
    displayName: string
    username: string
    bio?: string
    specialty?: string
    accountType?: string
  }) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(SupabaseUser & { profile?: User }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const [timeoutWarningTime, setTimeoutWarningTime] = useState(0)

  console.log('AuthProvider render - userExists:', !!user, 'loading:', loading)

  // Helper function to fetch and attach user profile
  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const profileResult = await dbService.getUser(supabaseUser.id)
      if (profileResult.success && profileResult.data) {
        return { ...supabaseUser, profile: profileResult.data }
      } else {
        console.warn('Could not fetch user profile:', profileResult.error)
        return supabaseUser
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return supabaseUser
    }
  }

  // Session timeout management - re-enabled with proper timing
  const { extend: extendSession } = useIdleTimeout({
    timeout: 30 * 60 * 1000, // 30 minutes idle timeout
    warningTime: 2 * 60 * 1000, // 2 minutes warning before timeout
    onWarning: timeLeft => {
      if (user && !loading) {
        setTimeoutWarningTime(timeLeft)
        setShowTimeoutWarning(true)
      }
    },
    onTimeout: () => {
      if (user && !loading) {
        console.log('Session timeout - signing out user')
        logAuthEvent('session_timeout', { userId: user.id, email: user.email })
        signOut()
        setShowTimeoutWarning(false)
      }
    },
  })

  // Reset warning when user signs out
  useEffect(() => {
    if (!user) {
      setShowTimeoutWarning(false)
      setTimeoutWarningTime(0)
    }
  }, [user])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured')
      setLoading(false)
      return
    }

    let mounted = true

    // Get initial session
    const initAuth = async () => {
      try {
        console.log('Getting initial session...')
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error('Initial session error:', error)
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (session?.user) {
          console.log('Initial session found')
          // Sync session to server cookies so middleware sees authenticated state
          try {
            if (session.access_token && session.refresh_token) {
              await fetch('/api/auth/set-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  access_token: session.access_token,
                  refresh_token: session.refresh_token,
                }),
              })
            }
          } catch (e) {
            console.warn('Failed to sync session to server on init', e)
          }
          if (mounted) {
            const userWithProfile = await fetchUserProfile(session.user)
            setUser(userWithProfile)
          }
        } else {
          console.log('No initial session found')
        }

        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Init auth error:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, 'has session:', !!session)

      if (!mounted) return

      // Log auth state changes for monitoring
      logAuthEvent(`auth_state_${event}`, {
        userId: session?.user?.id,
        email: session?.user?.email,
        metadata: { event, hasSession: !!session },
      })

      if (session?.user) {
        console.log('Setting user from auth change')
        // Sync session to server cookies on sign-in/refresh
        try {
          if (session.access_token && session.refresh_token) {
            await fetch('/api/auth/set-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }),
            })
          }
        } catch (e) {
          console.warn('Failed to sync session to server on auth change', e)
        }
        const userWithProfile = await fetchUserProfile(session.user)
        setUser(userWithProfile)
      } else {
        console.log('Clearing user from auth change')
        setUser(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim()
    logAuthEvent('signin_attempt', { email: trimmedEmail })

    try {
      console.log('SignIn attempt initiated')
      setLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      })

      if (error) {
        console.error('SignIn error:', error)
        logAuthEvent('signin_failure', {
          email: trimmedEmail,
          metadata: { error: error.message },
        })
        setLoading(false)
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log('SignIn successful')
        logAuthEvent('signin_success', {
          userId: data.user.id,
          email: data.user.email,
        })
        // Don't set loading to false here - let the auth state change handler do it
        // The user state will be updated by the onAuthStateChange listener
        return { success: true }
      }

      logAuthEvent('signin_failure', {
        email: trimmedEmail,
        metadata: { error: 'No user returned' },
      })
      setLoading(false)
      return { success: false, error: 'No user returned from sign in' }
    } catch (error) {
      console.error('SignIn exception:', error)
      logAuthEvent('signin_failure', {
        email: trimmedEmail,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
      setLoading(false)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (data: {
    email: string
    password: string
    displayName: string
    username: string
    bio?: string
    specialty?: string
    accountType?: string
  }): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = data.email.trim()
    logAuthEvent('signup_attempt', { email: trimmedEmail })

    try {
      console.log('SignUp attempt initiated')
      setLoading(true)

      const { data: authData, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName,
            username: data.username,
            bio: data.bio || '',
            specialty: data.specialty || '',
            account_type: data.accountType || 'writer',
          },
        },
      })

      if (error) {
        console.error('SignUp error:', error)
        logAuthEvent('signup_failure', {
          email: trimmedEmail,
          metadata: { error: error.message },
        })
        setLoading(false)
        return { success: false, error: error.message }
      }

      if (authData.user) {
        console.log('SignUp successful')
        logAuthEvent('signup_success', {
          userId: authData.user.id,
          email: authData.user.email,
        })
        return { success: true }
      }

      logAuthEvent('signup_failure', {
        email: trimmedEmail,
        metadata: { error: 'No user returned' },
      })
      setLoading(false)
      return { success: false, error: 'No user returned from sign up' }
    } catch (error) {
      console.error('SignUp exception:', error)
      logAuthEvent('signup_failure', {
        email: trimmedEmail,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
      setLoading(false)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    try {
      console.log('SignOut attempt')
      logAuthEvent('signout_attempt', { userId: user?.id, email: user?.email })

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('SignOut error:', error)
        logAuthEvent('signout_failure', {
          userId: user?.id,
          metadata: { error: error.message },
        })
      } else {
        console.log('SignOut successful')
        logAuthEvent('signout_success', { userId: user?.id })
        setUser(null)
      }
    } catch (error) {
      console.error('SignOut exception:', error)
      logAuthEvent('signout_failure', {
        userId: user?.id,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
    }
  }

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim()
    logAuthEvent('password_reset_request', { email: trimmedEmail })

    try {
      console.log('ForgotPassword attempt initiated')
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail)

      if (error) {
        console.error('ForgotPassword error:', error)
        logAuthEvent('password_reset_failure', {
          email: trimmedEmail,
          metadata: { error: error.message },
        })
        return { success: false, error: error.message }
      }

      console.log('ForgotPassword email sent successfully')
      logAuthEvent('password_reset_success', { email: trimmedEmail })
      return { success: true }
    } catch (error) {
      console.error('ForgotPassword exception:', error)
      logAuthEvent('password_reset_failure', {
        email: trimmedEmail,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const handleExtendSession = () => {
    extendSession()
    setShowTimeoutWarning(false)
  }

  const handleTimeoutLogout = () => {
    setShowTimeoutWarning(false)
    signOut()
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    forgotPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionTimeoutWarning
        isOpen={showTimeoutWarning}
        timeLeft={timeoutWarningTime}
        onExtend={handleExtendSession}
        onLogout={handleTimeoutLogout}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
