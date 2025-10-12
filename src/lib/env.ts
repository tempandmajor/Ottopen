/**
 * Environment variable validation and type-safe access
 * This file ensures all required environment variables are present at build time
 */

import { z } from 'zod'

// Define the schema for environment variables
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Sentry (optional)
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, 'Stripe secret key is required'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'Stripe publishable key is required'),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),

  // Email (optional for development)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),

  // Vercel KV (optional - for rate limiting)
  KV_URL: z.string().url().optional(),
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  KV_REST_API_READ_ONLY_TOKEN: z.string().optional(),
})

// Type for validated environment variables
export type Env = z.infer<typeof envSchema>

// Validate and parse environment variables
function validateEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env)

    // SEC-013: Security check - ensure secrets don't have NEXT_PUBLIC_ prefix
    const secretKeys = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'NEXTAUTH_SECRET',
      'SMTP_PASS',
      'KV_REST_API_TOKEN',
    ]

    for (const key of secretKeys) {
      const publicKey = `NEXT_PUBLIC_${key}`
      if (process.env[publicKey]) {
        throw new Error(
          `Security Error: Found ${publicKey} in environment. ` +
            `Secret keys must NOT use NEXT_PUBLIC_ prefix as this exposes them to the client!`
        )
      }
    }

    // Warn if critical services are missing in production
    if (parsed.NODE_ENV === 'production') {
      if (!parsed.KV_REST_API_TOKEN) {
        console.warn('⚠️  Rate limiting disabled - KV_REST_API_TOKEN not configured')
      }
    }

    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      console.error('❌ Invalid environment variables:\n', missingVars.join('\n'))
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\nPlease check your .env.local file.`
      )
    }
    throw error
  }
}

// Validate on module load (build time and runtime)
let env: Env

try {
  env = validateEnv()
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment variables validated successfully')
  }
} catch (error) {
  // In development, show warning but don't crash
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Environment validation failed (development mode):', error)
    env = process.env as unknown as Env
  } else {
    // In production, crash immediately
    throw error
  }
}

export { env }

// Helper function to check if running in production
export const isProd = () => env.NODE_ENV === 'production'

// Helper function to check if running in development
export const isDev = () => env.NODE_ENV === 'development'

// Helper function to check if running tests
export const isTest = () => env.NODE_ENV === 'test'

// Helper to check if Sentry is configured
export const isSentryConfigured = () => !!(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN)

// Helper to check if email is configured
export const isEmailConfigured = () =>
  !!(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS)

// Helper to check if Vercel KV is configured
export const isKVConfigured = () => !!(env.KV_URL && env.KV_REST_API_URL && env.KV_REST_API_TOKEN)
