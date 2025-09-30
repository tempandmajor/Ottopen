/**
 * Rate Limiting Tests
 */

import { NextRequest } from 'next/server'
import { RedisRateLimiter } from '@/src/lib/rate-limit-redis'

// Mock Vercel KV
jest.mock('@vercel/kv', () => ({
  kv: {
    zadd: jest.fn().mockResolvedValue(1),
    zremrangebyscore: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    zcard: jest.fn().mockResolvedValue(1),
  },
}))

describe('Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('RedisRateLimiter', () => {
    it('should allow requests within limit', async () => {
      const limiter = new RedisRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      })

      const result = await limiter.checkRateLimit(request)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBeGreaterThanOrEqual(0)
    })

    it('should block requests exceeding limit', async () => {
      const { kv } = require('@vercel/kv')
      kv.zcard.mockResolvedValueOnce(10) // Simulate 10 requests already made

      const limiter = new RedisRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      })

      const result = await limiter.checkRateLimit(request)

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeDefined()
    })

    it('should use custom key generator', async () => {
      const customKeyGenerator = jest.fn().mockReturnValue('custom-key')

      const limiter = new RedisRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: customKeyGenerator,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      await limiter.checkRateLimit(request)

      expect(customKeyGenerator).toHaveBeenCalledWith(request)
    })

    it('should handle Redis errors gracefully', async () => {
      const { kv } = require('@vercel/kv')
      kv.zadd.mockRejectedValueOnce(new Error('Redis connection failed'))

      const limiter = new RedisRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      const result = await limiter.checkRateLimit(request)

      // Should allow request on Redis failure (fail open)
      expect(result.success).toBe(true)
    })

    it('should set TTL on keys', async () => {
      const { kv } = require('@vercel/kv')

      const limiter = new RedisRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      await limiter.checkRateLimit(request)

      expect(kv.expire).toHaveBeenCalled()
    })

    it('should remove old entries', async () => {
      const { kv } = require('@vercel/kv')

      const limiter = new RedisRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      await limiter.checkRateLimit(request)

      expect(kv.zremrangebyscore).toHaveBeenCalled()
    })
  })
})
