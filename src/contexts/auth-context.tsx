'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase'
import type { User } from '@/src/lib/supabase'

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

  console.log('AuthProvider render - user:', user ? user.email : 'null', 'loading:', loading)

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
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Initial session error:', error)
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (session?.user) {
          console.log('Initial session found for:', session.user.email)
          if (mounted) {
            setUser(session.user)
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, 'has session:', !!session)

      if (!mounted) return

      if (session?.user) {
        console.log('Setting user from auth change:', session.user.email)
        setUser(session.user)
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

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('SignIn attempt for:', email)
      setLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        console.error('SignIn error:', error)
        setLoading(false)
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log('SignIn successful for:', data.user.email)
        // Don't set user here, let the auth state change handler do it
        return { success: true }
      }

      setLoading(false)
      return { success: false, error: 'No user returned from sign in' }
    } catch (error) {
      console.error('SignIn exception:', error)
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
    try {
      console.log('SignUp attempt for:', data.email)
      setLoading(true)

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim(),
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
        setLoading(false)
        return { success: false, error: error.message }
      }

      if (authData.user) {
        console.log('SignUp successful for:', authData.user.email)
        return { success: true }
      }

      setLoading(false)
      return { success: false, error: 'No user returned from sign up' }
    } catch (error) {
      console.error('SignUp exception:', error)
      setLoading(false)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    try {
      console.log('SignOut attempt')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('SignOut error:', error)
      } else {
        console.log('SignOut successful')
        setUser(null)
      }
    } catch (error) {
      console.error('SignOut exception:', error)
    }
  }

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('ForgotPassword attempt for:', email)
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) {
        console.error('ForgotPassword error:', error)
        return { success: false, error: error.message }
      }

      console.log('ForgotPassword email sent successfully')
      return { success: true }
    } catch (error) {
      console.error('ForgotPassword exception:', error)
      return { success: false, error: 'An unexpected error occurred' }
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