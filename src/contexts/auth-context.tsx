'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase'
import { authService } from '@/src/lib/auth'
import { logError, logInfo } from '@/src/lib/logger'
import type { User } from '@/src/lib/supabase'

interface AuthContextType {
  user: (SupabaseUser & { profile?: User }) | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (data: {
    email: string
    password: string
    displayName: string
    username: string
    bio?: string
    specialty?: string
    accountType?:
      | 'writer'
      | 'platform_agent'
      | 'external_agent'
      | 'producer'
      | 'publisher'
      | 'theater_director'
      | 'reader_evaluator'
    companyName?: string
    industryCredentials?: string
    licenseNumber?: string
  }) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(SupabaseUser & { profile?: User }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      logInfo('Supabase not configured, skipping auth initialization')
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        // First try to get existing session
        let {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        // If no session or error, try to refresh
        if (!session && !error) {
          logInfo('No session found, attempting refresh...')
          const refreshResult = await supabase.auth.refreshSession()
          session = refreshResult.data.session
          error = refreshResult.error
        }

        if (session?.user) {
          logInfo('Session found, getting user profile...')
          const { user: userWithProfile, error: profileError } = await authService.getCurrentUser()
          // Always preserve the authenticated session, even if profile fetch fails
          if (userWithProfile) {
            setUser(userWithProfile)
            logInfo('User set with profile')
          } else {
            // Fallback: use the session user without profile
            setUser({ ...session.user, profile: null })
            logInfo('User set without profile (fallback)')
          }
        } else {
          logInfo('No valid session found')
        }
      } catch (error) {
        logError('Failed to get initial session', error as Error)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('=== AUTH STATE CHANGE ===')
      console.log('Event:', event)
      console.log('Has session:', !!session)
      console.log('User ID:', session?.user?.id)
      console.log('User email:', session?.user?.email)

      logInfo('Auth state changed', { event })

      try {
        if (session?.user) {
          console.log('Session found, getting user profile...')
          logInfo('Getting current user profile after auth state change')
          const { user: userWithProfile, error } = await authService.getCurrentUser()
          if (error) {
            console.log('getCurrentUser error:', error)
            logError('getCurrentUser returned error', error)
          }

          // Always preserve the authenticated session, even if profile fetch fails
          if (userWithProfile) {
            console.log('Setting user with profile:', {
              hasProfile: !!userWithProfile?.profile,
              displayName: userWithProfile?.profile?.display_name,
            })
            logInfo('Setting user in context with profile', {
              hasProfile: !!userWithProfile?.profile,
            })
            setUser(userWithProfile)
          } else {
            console.log('Profile fetch failed, using session fallback')
            logInfo('Profile fetch failed, using session user as fallback')
            setUser({ ...session.user, profile: null })
          }
        } else {
          console.log('No session, clearing user')
          logInfo('No session, setting user to null')
          setUser(null)
        }
      } catch (error) {
        console.log('Auth state change error:', error)
        logError('Failed to handle auth state change', error as Error)
        // If there's a session but we failed to process it, use the session as fallback
        if (session?.user) {
          console.log('Using emergency fallback user')
          logInfo('Using session user as emergency fallback')
          setUser({ ...session.user, profile: null })
        } else {
          setUser(null)
        }
      }

      console.log('Setting loading to false')
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error:
          'Authentication is not configured. Please set up your Supabase credentials in .env.local to enable sign in.',
      }
    }

    try {
      const { data, error } = await authService.signIn({ email, password })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      logError('Sign in error in context', error as Error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (data: {
    email: string
    password: string
    displayName: string
    username: string
    bio?: string
    specialty?: string
    accountType?:
      | 'writer'
      | 'platform_agent'
      | 'external_agent'
      | 'producer'
      | 'publisher'
      | 'theater_director'
      | 'reader_evaluator'
    companyName?: string
    industryCredentials?: string
    licenseNumber?: string
  }) => {
    if (!isSupabaseConfigured()) {
      return {
        error:
          'Authentication is not configured. Please set up your Supabase credentials in .env.local to enable user registration.',
      }
    }

    try {
      const { data: authData, error } = await authService.signUp(data)

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      logError('Sign up error in context', error as Error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      return
    }

    try {
      await authService.signOut()
      setUser(null)
    } catch (error) {
      logError('Sign out error in context', error as Error)
    }
  }

  const forgotPassword = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error:
          'Authentication is not configured. Please set up your Supabase credentials in .env.local to enable password reset.',
      }
    }

    try {
      const { error } = await authService.forgotPassword({ email })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      logError('Forgot password error in context', error as Error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    forgotPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
