import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from '@/src/lib/rate-limit'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getValidatedEnvVar } from '@/src/lib/env-validation'
import logger from '@/src/lib/logger'

// Lazy initialization for Upstash Redis
let _redis: Redis | null | undefined = undefined
let _upstashSignin: Ratelimit | null | undefined = undefined
let _upstashSignup: Ratelimit | null | undefined = undefined

function getUpstashRateLimiters(): {
  redis: Redis | null
  signin: Ratelimit | null
  signup: Ratelimit | null
} {
  // Return cached instances if already initialized
  if (_redis !== undefined) {
    return {
      redis: _redis,
      signin: _upstashSignin || null,
      signup: _upstashSignup || null,
    }
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
      logger.info('[RATE_LIMIT] Initializing Upstash Redis rate limiters')
      _redis = new Redis({ url, token })
      _upstashSignin = new Ratelimit({ redis: _redis, limiter: Ratelimit.slidingWindow(5, '5 m') })
      _upstashSignup = new Ratelimit({ redis: _redis, limiter: Ratelimit.slidingWindow(3, '5 m') })
    } else {
      logger.info(
        '[RATE_LIMIT] Upstash Redis not configured, using in-memory rate limiting fallback'
      )
      _redis = null
      _upstashSignin = null
      _upstashSignup = null
    }
  } catch (error) {
    logger.error('[RATE_LIMIT] Error initializing Upstash Redis:', error)
    _redis = null
    _upstashSignin = null
    _upstashSignup = null
  }

  return {
    redis: _redis,
    signin: _upstashSignin,
    signup: _upstashSignup,
  }
}

// Fallback in-memory (single-instance) limiters
const signinLimiter = new RateLimiter({ windowMs: 5 * 60 * 1000, maxRequests: 5 })
const signupLimiter = new RateLimiter({ windowMs: 5 * 60 * 1000, maxRequests: 3 })

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : req.ip || 'unknown'
}

function buildKey(req: NextRequest, email: string | undefined, op: 'signin' | 'signup') {
  const ip = getClientIp(req)
  const normalizedEmail = (email || '').trim().toLowerCase()
  return `${op}:${ip}:${normalizedEmail}`
}

export async function POST(req: NextRequest) {
  try {
    const { operation, email } = (await req.json().catch(() => ({}))) as {
      operation?: 'signin' | 'signup'
      email?: string
    }

    if (operation !== 'signin' && operation !== 'signup') {
      return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }

    const key = buildKey(req, email, operation)

    // Get Upstash rate limiters lazily
    const { signin: upstashSignin, signup: upstashSignup } = getUpstashRateLimiters()
    const hasUpstash = upstashSignin !== null && upstashSignup !== null

    // Use Upstash if available
    let result: {
      success: boolean
      limit: number
      remaining: number
      resetTime: number
      retryAfter?: number
    }
    if (hasUpstash) {
      const rate = operation === 'signin' ? upstashSignin! : upstashSignup!
      const rl = await rate.limit(key)
      result = {
        success: rl.success,
        limit: rl.limit,
        remaining: Math.max(0, rl.remaining),
        resetTime: rl.reset,
        retryAfter: rl.success ? undefined : Math.ceil((rl.reset - Date.now()) / 1000),
      }
    } else {
      // Fallback to in-memory limiter with synthetic key as forwarded-for
      const base = operation === 'signin' ? signinLimiter : signupLimiter
      const proxy = new Proxy(req, {
        get(target, prop, receiver) {
          if (prop === 'headers') {
            const headers = new Headers(target.headers)
            headers.set('x-forwarded-for', key)
            return headers
          }
          return Reflect.get(target as any, prop, receiver)
        },
      }) as unknown as NextRequest
      result = await base.checkRateLimit(proxy)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: result.retryAfter },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': (result.retryAfter || 60).toString(),
          },
        }
      )
    }

    return NextResponse.json(
      { ok: true },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
        },
      }
    )
  } catch (e) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}
