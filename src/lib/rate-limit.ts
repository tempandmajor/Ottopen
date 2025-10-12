import { NextRequest } from 'next/server'

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

export class RateLimiter {
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

  async checkRateLimit(request: NextRequest): Promise<{
    success: boolean
    limit: number
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    const key = this.keyGenerator(request)
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Clean up old entries periodically
    this.cleanup(windowStart)

    let entry = rateLimitStore.get(key)

    if (!entry || entry.resetTime <= now) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime: now + this.windowMs,
      }
      rateLimitStore.set(key, entry)

      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        resetTime: entry.resetTime,
      }
    }

    // Check if limit exceeded
    if (entry.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      }
    }

    // Increment counter
    entry.count++
    rateLimitStore.set(key, entry)

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }

  private cleanup(windowStart: number) {
    // Remove entries older than current window (basic cleanup)
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < windowStart) {
        rateLimitStore.delete(key)
      }
    }
  }
}

// Pre-configured rate limiters for different auth operations
export const authRateLimiters = {
  // Signin: 5 attempts per minute
  signin: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  }),

  // Signup: 3 attempts per 5 minutes
  signup: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3,
  }),

  // Password reset: 2 attempts per 5 minutes
  passwordReset: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 2,
  }),

  // Password verification: 10 attempts per minute
  passwordVerification: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  }),
}

// Middleware helper for applying rate limiting
export function withRateLimit(
  rateLimiter: RateLimiter,
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
