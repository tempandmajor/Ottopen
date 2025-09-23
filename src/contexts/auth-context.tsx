'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/src/lib/supabase'
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
  }) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(SupabaseUser & { profile?: User }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { user: userWithProfile } = await authService.getCurrentUser()
        setUser(userWithProfile)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logInfo('Auth state changed', { event })

        if (session?.user) {
          const { user: userWithProfile } = await authService.getCurrentUser()
          setUser(userWithProfile)
        } else {
          setUser(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
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
  }) => {
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
    try {
      await authService.signOut()
      setUser(null)
    } catch (error) {
      logError('Sign out error in context', error as Error)
    }
  }

  const forgotPassword = async (email: string) => {
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