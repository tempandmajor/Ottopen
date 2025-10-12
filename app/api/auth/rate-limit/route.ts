import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from '@/src/lib/rate-limit'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// If Upstash is configured, use it. Otherwise, fallback to in-memory limiter.
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const redis = hasUpstash
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
  : null

const upstashSignin = hasUpstash ? new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(5, '5 m') }) : null
const upstashSignup = hasUpstash ? new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(3, '5 m') }) : null

// Fallback in-memory (single-instance) limiters
const signinLimiter = new RateLimiter({ windowMs: 5 * 60 * 1000, maxRequests: 5 })
const signupLimiter = new RateLimiter({ windowMs: 5 * 60 * 1000, maxRequests: 3 })

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : (req.ip || 'unknown')
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

    // Use Upstash if available
    let result: { success: boolean; limit: number; remaining: number; resetTime: number; retryAfter?: number }
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
