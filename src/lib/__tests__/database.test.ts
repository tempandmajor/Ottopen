/**
 * Database Operations Tests
 */

import { executeQuery, withRetry, withTimeout } from '@/src/lib/supabase-pool'

describe('Database Operations', () => {
  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      const result = await withRetry(operation)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce('success')

      const result = await withRetry(operation, 3, 10)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should throw after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent error'))

      await expect(withRetry(operation, 3, 10)).rejects.toThrow('Persistent error')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should not retry on permission errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('JWT expired'))

      await expect(withRetry(operation, 3, 10)).rejects.toThrow('JWT expired')
      expect(operation).toHaveBeenCalledTimes(1)
    })
  })

  describe('withTimeout', () => {
    it('should complete before timeout', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      const result = await withTimeout(operation, 1000)

      expect(result).toBe('success')
    })

    it('should timeout on slow operations', async () => {
      const operation = jest
        .fn()
        .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('late'), 2000)))

      await expect(withTimeout(operation, 100)).rejects.toThrow('Query timeout')
    })
  })

  describe('executeQuery', () => {
    it('should execute query with retry and timeout', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      const result = await executeQuery(operation, {
        maxRetries: 3,
        timeoutMs: 5000,
      })

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should handle failures with retry', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success')

      const result = await executeQuery(operation, {
        maxRetries: 3,
        timeoutMs: 5000,
      })

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })
})
