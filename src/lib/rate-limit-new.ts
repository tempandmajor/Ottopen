import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { getValidatedEnvVar } from '@/src/lib/env-validation'

// Lazy initialization for Redis and rate limiters
let _redis: Redis | null | undefined = undefined
let _rateLimiters:
  | {
      ai: Ratelimit | null
      referral: Ratelimit | null
      auth: Ratelimit | null
      api: Ratelimit | null
      payout: Ratelimit | null
    }
  | undefined = undefined

function initializeRateLimiters(): {
  ai: Ratelimit | null
  referral: Ratelimit | null
  auth: Ratelimit | null
  api: Ratelimit | null
  payout: Ratelimit | null
} {
  // Return cached instance if already initialized
  if (_rateLimiters !== undefined) {
    return _rateLimiters
  }

  try {
    // Validate environment variables with proper sanitization
    const url = getValidatedEnvVar('UPSTASH_REDIS_REST_URL', 'url', {
      required: false,
      protocol: 'https',
    })
    const token = getValidatedEnvVar('UPSTASH_REDIS_REST_TOKEN', 'token', {
      required: false,
      minLength: 10,
    })

    if (url && token) {
      console.log('[RATE_LIMIT] Initializing Upstash Redis rate limiters')
      _redis = new Redis({ url, token })

      _rateLimiters = {
        // AI endpoints - expensive API calls
        ai: new Ratelimit({
          redis: _redis,
          limiter: Ratelimit.slidingWindow(10, '60 s'),
          analytics: true,
        }),

        // Referral endpoints - prevent fraud
        referral: new Ratelimit({
          redis: _redis,
          limiter: Ratelimit.slidingWindow(20, '300 s'), // 20 per 5 minutes
          analytics: true,
        }),

        // Auth endpoints - prevent brute force
        auth: new Ratelimit({
          redis: _redis,
          limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 per minute
          analytics: true,
        }),

        // General API - standard protection
        api: new Ratelimit({
          redis: _redis,
          limiter: Ratelimit.slidingWindow(100, '60 s'), // 100 per minute
          analytics: true,
        }),

        // Payout endpoints - critical financial operations
        payout: new Ratelimit({
          redis: _redis,
          limiter: Ratelimit.slidingWindow(5, '300 s'), // 5 per 5 minutes
          analytics: true,
        }),
      }
    } else {
      console.log('[RATE_LIMIT] Upstash Redis not configured, rate limiting will be disabled')
      _redis = null
      _rateLimiters = {
        ai: null,
        referral: null,
        auth: null,
        api: null,
        payout: null,
      }
    }
  } catch (error) {
    console.error('[RATE_LIMIT] Error initializing Upstash Redis:', error)
    _redis = null
    _rateLimiters = {
      ai: null,
      referral: null,
      auth: null,
      api: null,
      payout: null,
    }
  }

  return _rateLimiters
}

// Export lazy getters
export const rateLimiters = new Proxy(
  {} as {
    ai: Ratelimit | null
    referral: Ratelimit | null
    auth: Ratelimit | null
    api: Ratelimit | null
    payout: Ratelimit | null
  },
  {
    get(_target, prop) {
      const limiters = initializeRateLimiters()
      return limiters[prop as keyof typeof limiters]
    },
  }
)

export type RateLimiter = keyof typeof rateLimiters

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  limiterType: RateLimiter = 'api'
): Promise<{ success: boolean; error?: NextResponse }> {
  const limiter = rateLimiters[limiterType]

  // If Redis not configured, allow request but log warning
  if (!limiter) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Rate limiting disabled - UPSTASH_REDIS_REST_URL not configured')
    }
    return { success: true }
  }

  try {
    // Get user ID for authenticated requests
    const { user } = await getServerUser()
    const identifier = user?.id || request.ip || 'anonymous'

    // Check rate limit
    const { success, limit, remaining, reset } = await limiter.limit(identifier)

    if (!success) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        ),
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // On error, allow request but log
    return { success: true }
  }
}

/**
 * Helper to apply rate limiting to route handlers
 */
export function createRateLimitedHandler<T extends any[]>(
  limiterType: RateLimiter,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const rateLimitResult = await withRateLimit(request, limiterType)

    if (!rateLimitResult.success) {
      return rateLimitResult.error!
    }

    return handler(request, ...args)
  }
}
