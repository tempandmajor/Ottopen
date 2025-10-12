import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!.trim(),
      token: process.env.UPSTASH_REDIS_REST_TOKEN!.trim(),
    })
  : null

// Create rate limiters for different use cases
export const rateLimiters = {
  // AI endpoints - expensive API calls
  ai: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '60 s'),
        analytics: true,
      })
    : null,

  // Referral endpoints - prevent fraud
  referral: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '300 s'), // 20 per 5 minutes
        analytics: true,
      })
    : null,

  // Auth endpoints - prevent brute force
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 per minute
        analytics: true,
      })
    : null,

  // General API - standard protection
  api: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '60 s'), // 100 per minute
        analytics: true,
      })
    : null,

  // Payout endpoints - critical financial operations
  payout: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '300 s'), // 5 per 5 minutes
        analytics: true,
      })
    : null,
}

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
