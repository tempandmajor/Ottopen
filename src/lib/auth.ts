import { supabase, isSupabaseConfigured } from './supabase'
import { logError, logInfo } from './logger'
import { z } from 'zod'

// Validation schemas
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().optional(),
  specialty: z.string().optional(),
  accountType: z
    .enum([
      'writer',
      'platform_agent',
      'external_agent',
      'producer',
      'publisher',
      'theater_director',
      'reader_evaluator',
    ])
    .optional(),
  companyName: z.string().optional(),
  industryCredentials: z.string().optional(),
  licenseNumber: z.string().optional(),
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

      // Sign up with Supabase Auth - include all data in metadata for trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            display_name: validatedData.displayName,
            username: validatedData.username,
            bio: validatedData.bio || '',
            specialty: validatedData.specialty || '',
            accountType: validatedData.accountType || 'writer',
            companyName: validatedData.companyName || null,
            industryCredentials: validatedData.industryCredentials || null,
            licenseNumber: validatedData.licenseNumber || null,
          },
        },
      })

      if (authError) {
        logError('Sign up failed', authError)
        throw authError
      }

      // Profile will be created automatically by the database trigger
      // No need for manual profile creation

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

      const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      })

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
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        logError('Failed to get current user', error)
        return { user: null, error }
      }

      if (!user) {
        return { user: null, error: null }
      }

      // Get user profile (base table, self-only)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        // Fallback to safe public view to avoid UX regressions when base-table RLS blocks or row missing
        if (profileError) {
          logError('Failed to get user profile from base table, falling back to view', profileError)
        } else {
          logInfo('Base-table profile is null, falling back to public view')
        }

        const { data: publicProfile, error: publicProfileError } = await supabase
          .from('user_public_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (publicProfileError) {
          logError('Failed to get user profile from public view', publicProfileError)
          // Still return the user even if profile fetch fails, for UI to continue
          return { user: { ...user, profile: null }, error: null }
        }

        return { user: { ...user, profile: publicProfile }, error: null }
      }

      return { user: { ...user, profile }, error: null }
    } catch (error) {
      logError('Get current user error', error as Error)
      return { user: null, error: error as Error }
    }
  },

  async updatePassword(newPassword: string) {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase is not configured' }
    }

    try {
      // Validate new password
      if (newPassword.length < 8) {
        return { error: 'Password must be at least 8 characters long' }
      }

      // Update password directly - user must be authenticated to reach this point
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        logError('Password update failed', updateError)
        return { error: updateError.message }
      }

      logInfo('Password updated successfully')
      return { error: null }
    } catch (error) {
      logError('Update password error', error as Error)
      return { error: (error as Error).message }
    }
  },

  async verifyCurrentPassword(currentPassword: string) {
    if (!isSupabaseConfigured()) {
      return { valid: false, error: 'Supabase is not configured' }
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) {
        return { valid: false, error: 'User not authenticated' }
      }

      // SECURITY FIX: Use server-side verification instead of client-side signin
      // This approach avoids creating a new session that could interfere with the current one
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          password: currentPassword
        }),
      })

      if (!response.ok) {
        return { valid: false, error: 'Password verification failed' }
      }

      const result = await response.json()
      return { valid: result.valid, error: result.error }
    } catch (error) {
      logError('Password verification error', error as Error)
      return { valid: false, error: (error as Error).message }
    }
  },
}
