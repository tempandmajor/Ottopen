import { POST } from './route'
import { NextResponse } from 'next/server'

describe('Rate Limit API', () => {
  function makeReq(operation: 'signin' | 'signup', email: string, ip = '1.2.3.4') {
    const body = { operation, email }
    const headers = new Map<string, string>([[
      'x-forwarded-for',
      ip,
    ]])
    return {
      headers: {
        get: (key: string) => headers.get(key.toLowerCase()) || headers.get(key) || null,
      },
      ip,
      json: async () => body,
    } as any
  }

  it('signin: allows 5 attempts then 429 on 6th within window', async () => {
    // Ensure Upstash path is not used during unit test
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const req = makeReq('signin', 'test@example.com', '10.0.0.1')

    let res: NextResponse | Response | any
    for (let i = 1; i <= 5; i++) {
      res = await POST(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined()
      expect(res.headers.get('X-RateLimit-Reset')).toBeDefined()
    }

    // 6th attempt should be blocked
    res = await POST(req)
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.retryAfter).toBeDefined()
    expect(res.headers.get('Retry-After')).toBeDefined()
  })

  it('signup: allows 3 attempts then 429 on 4th within window', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const req = makeReq('signup', 'new@example.com', '10.0.0.2')

    let res: NextResponse | Response | any
    for (let i = 1; i <= 3; i++) {
      res = await POST(req)
      expect(res.status).toBe(200)
    }

    res = await POST(req)
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.retryAfter).toBeDefined()
  })
})
