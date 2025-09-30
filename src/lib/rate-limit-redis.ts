import { kv } from '@vercel/kv'
import { NextRequest } from 'next/server'

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export class RedisRateLimiter {
  private windowMs: number
  private maxRequests: number
  private keyGenerator: (request: NextRequest) => string

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs
    this.maxRequests = options.maxRequests
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator
  }

  private defaultKeyGenerator(request: NextRequest): string {
    // Use IP address as default key
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    return ip
  }

  async checkRateLimit(request: NextRequest): Promise<RateLimitResult> {
    try {
      const key = `ratelimit:${this.keyGenerator(request)}`
      const now = Date.now()
      const windowStart = now - this.windowMs

      // Use Redis sorted set to track requests
      // Score is timestamp, value is unique request ID
      const requestId = `${now}-${Math.random()}`

      // Add current request
      await kv.zadd(key, { score: now, member: requestId })

      // Remove old requests outside the window
      await kv.zremrangebyscore(key, 0, windowStart)

      // Set expiration on the key
      await kv.expire(key, Math.ceil(this.windowMs / 1000))

      // Count requests in current window
      const count = await kv.zcard(key)

      const resetTime = now + this.windowMs
      const remaining = Math.max(0, this.maxRequests - count)

      if (count > this.maxRequests) {
        return {
          success: false,
          limit: this.maxRequests,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil(this.windowMs / 1000),
        }
      }

      return {
        success: true,
        limit: this.maxRequests,
        remaining,
        resetTime,
      }
    } catch (error) {
      // Fallback to allowing request if Redis fails
      console.error('Rate limiting error:', error)
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests,
        resetTime: Date.now() + this.windowMs,
      }
    }
  }
}

// Pre-configured rate limiters for different auth operations
export const authRateLimiters = {
  // Signin: 5 attempts per minute
  signin: new RedisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  }),

  // Signup: 3 attempts per 5 minutes
  signup: new RedisRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3,
  }),

  // Password reset: 2 attempts per 5 minutes
  passwordReset: new RedisRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 2,
  }),

  // Password verification: 10 attempts per minute
  passwordVerification: new RedisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  }),

  // General API: 100 requests per minute
  api: new RedisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  }),
}

// Middleware helper for applying rate limiting
export function withRateLimit(
  rateLimiter: RedisRateLimiter,
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const result = await rateLimiter.checkRateLimit(request)

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': result.retryAfter?.toString() || '60',
          },
        }
      )
    }

    const response = await handler(request)

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString())

    return response
  }
}
