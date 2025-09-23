import { supabase, isSupabaseConfigured } from './supabase'
import { logError, logInfo } from './logger'
import { z } from 'zod'

// Validation schemas
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().optional(),
  specialty: z.string().optional(),
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type SignUpData = z.infer<typeof signUpSchema>
export type SignInData = z.infer<typeof signInSchema>
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>

// Auth service functions
export const authService = {
  async signUp(data: SignUpData) {
    if (!isSupabaseConfigured()) {
      const error = new Error('Supabase is not configured')
      return { data: null, error }
    }

    try {
      const validatedData = signUpSchema.parse(data)

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', validatedData.username)
        .single()

      if (existingUser) {
        throw new Error('Username is already taken')
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            display_name: validatedData.displayName,
            username: validatedData.username,
          }
        }
      })

      if (authError) {
        logError('Sign up failed', authError)
        throw authError
      }

      // Create user profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: validatedData.email,
            display_name: validatedData.displayName,
            username: validatedData.username,
            bio: validatedData.bio || '',
            specialty: validatedData.specialty || '',
          })

        if (profileError) {
          logError('Failed to create user profile', profileError)
          throw new Error('Failed to create user profile')
        }
      }

      logInfo('User signed up successfully', { email: validatedData.email })
      return { data: authData, error: null }
    } catch (error) {
      logError('Sign up error', error as Error)
      return { data: null, error: error as Error }
    }
  },

  async signIn(data: SignInData) {
    if (!isSupabaseConfigured()) {
      const error = new Error('Supabase is not configured')
      return { data: null, error }
    }

    try {
      const validatedData = signInSchema.parse(data)

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      })

      if (error) {
        logError('Sign in failed', error)
        throw error
      }

      logInfo('User signed in successfully', { email: validatedData.email })
      return { data: authData, error: null }
    } catch (error) {
      logError('Sign in error', error as Error)
      return { data: null, error: error as Error }
    }
  },

  async signOut() {
    if (!isSupabaseConfigured()) {
      const error = new Error('Supabase is not configured')
      return { error }
    }

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        logError('Sign out failed', error)
        throw error
      }

      logInfo('User signed out successfully')
      return { error: null }
    } catch (error) {
      logError('Sign out error', error as Error)
      return { error: error as Error }
    }
  },

  async forgotPassword(data: ForgotPasswordData) {
    if (!isSupabaseConfigured()) {
      const error = new Error('Supabase is not configured')
      return { error }
    }

    try {
      const validatedData = forgotPasswordSchema.parse(data)

      const { error } = await supabase.auth.resetPasswordForEmail(
        validatedData.email,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
        }
      )

      if (error) {
        logError('Password reset failed', error)
        throw error
      }

      logInfo('Password reset email sent', { email: validatedData.email })
      return { error: null }
    } catch (error) {
      logError('Password reset error', error as Error)
      return { error: error as Error }
    }
  },

  async getCurrentUser() {
    if (!isSupabaseConfigured()) {
      const error = new Error('Supabase is not configured')
      return { user: null, error }
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        logError('Failed to get current user', error)
        return { user: null, error }
      }

      if (!user) {
        return { user: null, error: null }
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        logError('Failed to get user profile', profileError)
        return { user, error: profileError }
      }

      return { user: { ...user, profile }, error: null }
    } catch (error) {
      logError('Get current user error', error as Error)
      return { user: null, error: error as Error }
    }
  },

}