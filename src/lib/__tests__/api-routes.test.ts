/**
 * API Routes Tests
 * Tests for all API endpoints
 */

import { NextRequest } from 'next/server'
import { GET as healthGet } from '@/app/api/health/route'
import { GET as authStatusGet } from '@/app/api/auth/status/route'

// Mock Supabase
jest.mock('@/src/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: '123' }, error: null })),
        })),
      })),
    })),
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: { id: '123', email: 'test@example.com' } },
          error: null,
        })
      ),
    },
  })),
}))

describe('API Routes', () => {
  describe('/api/health', () => {
    it('should return healthy status when all checks pass', async () => {
      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await healthGet(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.checks).toBeDefined()
      expect(data.checks.database.status).toBe('up')
      expect(data.timestamp).toBeDefined()
    })

    it('should include version information', async () => {
      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await healthGet(request)
      const data = await response.json()

      expect(data.version).toBeDefined()
    })

    it('should include database latency', async () => {
      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await healthGet(request)
      const data = await response.json()

      expect(data.checks.database.latency).toBeDefined()
      expect(typeof data.checks.database.latency).toBe('number')
    })
  })

  describe('/api/auth/status', () => {
    it('should return authenticated status for logged-in users', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/status')
      const response = await authStatusGet(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.authenticated).toBe(true)
    })

    it('should handle errors gracefully', async () => {
      const mockSupabase = require('@/src/lib/supabase-server')
      mockSupabase.createServerSupabaseClient.mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn(() => Promise.reject(new Error('Network error'))),
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/auth/status')
      const response = await authStatusGet(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.authenticated).toBe(false)
      expect(data.error).toBeDefined()
    })
  })
})

describe('API Error Handling', () => {
  it('should return standardized error format', async () => {
    const mockSupabase = require('@/src/lib/supabase-server')
    mockSupabase.createServerSupabaseClient.mockImplementationOnce(() => ({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({ data: null, error: { message: 'Database error' } })
            ),
          })),
        })),
      })),
    }))

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await healthGet(request)
    const data = await response.json()

    expect(data.checks.database.status).toBe('down')
    expect(data.checks.database.error).toBeDefined()
  })
})
