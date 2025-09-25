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
    accountType?: 'writer' | 'platform_agent' | 'external_agent' | 'producer' | 'publisher' | 'theater_director' | 'reader_evaluator'
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
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const { user: userWithProfile } = await authService.getCurrentUser()
          setUser(userWithProfile)
        }
      } catch (error) {
        logError('Failed to get initial session', error as Error)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logInfo('Auth state changed', { event })

        try {
          if (session?.user) {
            const { user: userWithProfile } = await authService.getCurrentUser()
            setUser(userWithProfile)
          } else {
            setUser(null)
          }
        } catch (error) {
          logError('Failed to handle auth state change', error as Error)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Authentication is not configured. Please set up your Supabase credentials in .env.local to enable sign in.' }
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
    accountType?: 'writer' | 'platform_agent' | 'external_agent' | 'producer' | 'publisher' | 'theater_director' | 'reader_evaluator'
    companyName?: string
    industryCredentials?: string
    licenseNumber?: string
  }) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Authentication is not configured. Please set up your Supabase credentials in .env.local to enable user registration.' }
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
      return { error: 'Authentication is not configured. Please set up your Supabase credentials in .env.local to enable password reset.' }
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