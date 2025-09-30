/**
 * Supabase client with connection pooling configuration
 * This ensures optimal database performance
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'

// Pooling configuration for better performance
const poolConfig = {
  // Auth configuration
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Global configuration
  global: {
    headers: {
      'x-application-name': 'ottopen',
    },
  },
  // Database configuration for optimal pooling
  db: {
    schema: 'public',
  },
  // Realtime configuration
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
}

// Service role client (for admin operations)
let serviceRoleClient: SupabaseClient | null = null

export function getServiceRoleClient(): SupabaseClient {
  if (!serviceRoleClient) {
    serviceRoleClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      ...poolConfig,
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }) as SupabaseClient
  }
  if (!serviceRoleClient) {
    throw new Error('Failed to initialize Supabase service role client')
  }
  return serviceRoleClient
}

// Client for public operations (anon key)
let anonClient: SupabaseClient | null = null

export function getAnonClient(): SupabaseClient {
  if (!anonClient) {
    anonClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      poolConfig
    ) as SupabaseClient
  }
  if (!anonClient) {
    throw new Error('Failed to initialize Supabase anon client')
  }
  return anonClient
}

/**
 * Execute a database query with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on certain errors
      if (
        lastError.message.includes('JWT') ||
        lastError.message.includes('permission') ||
        lastError.message.includes('not found')
      ) {
        throw lastError
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
      }
    }
  }

  throw lastError
}

/**
 * Execute a database query with timeout
 */
export async function withTimeout<T>(operation: () => Promise<T>, timeoutMs = 10000): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Query timeout')), timeoutMs)),
  ])
}

/**
 * Execute a database query with retry and timeout
 */
export async function executeQuery<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number
    timeoutMs?: number
  }
): Promise<T> {
  return withRetry(() => withTimeout(operation, options?.timeoutMs), options?.maxRetries)
}
