import { NextRequest } from 'next/server'

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string
  prefix?: string // Key prefix for namespacing
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

// Redis client interface to support both Upstash and Vercel KV
interface RedisClient {
  zadd: (key: string, options: { score: number; member: string }) => Promise<number>
  zremrangebyscore: (key: string, min: number, max: number) => Promise<number>
  zcard: (key: string) => Promise<number>
  expire: (key: string, seconds: number) => Promise<number>
}

// Create Redis client (supports Upstash REST or Vercel KV)
function createRedisClient(): RedisClient | null {
  // Try Upstash Redis REST API first
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    return {
      async zadd(key: string, options: { score: number; member: string }) {
        const res = await fetch(`${url}/zadd/${key}/${options.score}/${options.member}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        return data.result
      },
      async zremrangebyscore(key: string, min: number, max: number) {
        const res = await fetch(`${url}/zremrangebyscore/${key}/${min}/${max}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        return data.result
      },
      async zcard(key: string) {
        const res = await fetch(`${url}/zcard/${key}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        return data.result
      },
      async expire(key: string, seconds: number) {
        const res = await fetch(`${url}/expire/${key}/${seconds}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        return data.result
      },
    }
  }

  // Try Vercel KV as fallback
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      // Dynamic import to avoid errors if @vercel/kv is not installed
      const { kv } = require('@vercel/kv')
      return kv
    } catch (error) {
      console.warn('Vercel KV not available:', error)
    }
  }

  console.warn(
    'No Redis configuration found. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production rate limiting.'
  )
  return null
}

export class RedisRateLimiter {
  private windowMs: number
  private maxRequests: number
  private keyGenerator: (request: NextRequest) => string
  private prefix: string
  private redis: RedisClient | null

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs
    this.maxRequests = options.maxRequests
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator
    this.prefix = options.prefix || 'api'
    this.redis = createRedisClient()
  }

  private defaultKeyGenerator(request: NextRequest): string {
    // Use IP address as default key
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    return ip
  }

  async checkRateLimit(request: NextRequest): Promise<RateLimitResult> {
    // If Redis is not configured, allow the request but warn
    if (!this.redis) {
      if (process.env.NODE_ENV === 'production') {
        console.error(
          'CRITICAL: Redis not configured for rate limiting in production! Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
        )
      }
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests,
        resetTime: Date.now() + this.windowMs,
      }
    }

    try {
      const key = `ratelimit:${this.prefix}:${this.keyGenerator(request)}`
      const now = Date.now()
      const windowStart = now - this.windowMs

      // Use Redis sorted set to track requests
      // Score is timestamp, value is unique request ID
      const requestId = `${now}-${Math.random()}`

      // Add current request
      await this.redis.zadd(key, { score: now, member: requestId })

      // Remove old requests outside the window
      await this.redis.zremrangebyscore(key, 0, windowStart)

      // Set expiration on the key
      await this.redis.expire(key, Math.ceil(this.windowMs / 1000))

      // Count requests in current window
      const count = await this.redis.zcard(key)

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

// Helper function to create rate limiter with prefix
export function createRedisRateLimiter(options: RateLimitOptions): RedisRateLimiter {
  return new RedisRateLimiter(options)
}

// Pre-configured rate limiters for different auth operations
export const authRateLimiters = {
  // Signin: 5 attempts per minute
  signin: new RedisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    prefix: 'auth-signin',
  }),

  // Signup: 3 attempts per 5 minutes
  signup: new RedisRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3,
    prefix: 'auth-signup',
  }),

  // Password reset: 2 attempts per 5 minutes
  passwordReset: new RedisRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 2,
    prefix: 'auth-password-reset',
  }),

  // Password verification: 10 attempts per minute
  passwordVerification: new RedisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    prefix: 'auth-verify',
  }),

  // General API: 100 requests per minute
  api: new RedisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    prefix: 'api',
  }),

  // AI requests: 10 per minute (can be adjusted per tier)
  ai: new RedisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    prefix: 'ai',
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
