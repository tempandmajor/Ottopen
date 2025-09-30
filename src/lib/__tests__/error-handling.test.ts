/**
 * Error Handling Tests
 */

import { ApiError, ApiErrors, formatErrorResponse, ErrorCode } from '@/src/lib/api-error'
import { ZodError } from 'zod'

describe('API Error Handling', () => {
  describe('ApiError', () => {
    it('should create error with correct properties', () => {
      const error = new ApiError(ErrorCode.BAD_REQUEST, 'Invalid input', 400, { field: 'email' })

      expect(error).toBeInstanceOf(ApiError)
      expect(error.code).toBe(ErrorCode.BAD_REQUEST)
      expect(error.message).toBe('Invalid input')
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual({ field: 'email' })
    })
  })

  describe('ApiErrors factory', () => {
    it('should create badRequest error', () => {
      const error = ApiErrors.badRequest('Invalid data')

      expect(error.statusCode).toBe(400)
      expect(error.code).toBe(ErrorCode.BAD_REQUEST)
      expect(error.message).toBe('Invalid data')
    })

    it('should create unauthorized error', () => {
      const error = ApiErrors.unauthorized()

      expect(error.statusCode).toBe(401)
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED)
    })

    it('should create notFound error', () => {
      const error = ApiErrors.notFound('User not found')

      expect(error.statusCode).toBe(404)
      expect(error.code).toBe(ErrorCode.NOT_FOUND)
      expect(error.message).toBe('User not found')
    })

    it('should create validationError with details', () => {
      const error = ApiErrors.validationError('Validation failed', { fields: ['email', 'name'] })

      expect(error.statusCode).toBe(422)
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.details).toEqual({ fields: ['email', 'name'] })
    })

    it('should create rateLimitExceeded error', () => {
      const error = ApiErrors.rateLimitExceeded()

      expect(error.statusCode).toBe(429)
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED)
    })

    it('should create internalError', () => {
      const error = ApiErrors.internalError()

      expect(error.statusCode).toBe(500)
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR)
    })
  })

  describe('formatErrorResponse', () => {
    it('should format ApiError correctly', () => {
      const error = ApiErrors.badRequest('Invalid input', { field: 'email' })
      const { response, statusCode } = formatErrorResponse(error, '/api/users')

      expect(statusCode).toBe(400)
      expect(response.error.code).toBe(ErrorCode.BAD_REQUEST)
      expect(response.error.message).toBe('Invalid input')
      expect(response.error.path).toBe('/api/users')
      expect(response.error.timestamp).toBeDefined()
    })

    it('should format ZodError correctly', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        },
      ])

      const { response, statusCode } = formatErrorResponse(zodError)

      expect(statusCode).toBe(422)
      expect(response.error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(response.error.message).toBe('Validation failed')
    })

    it('should format generic Error correctly', () => {
      const error = new Error('Something went wrong')
      const { response, statusCode } = formatErrorResponse(error)

      expect(statusCode).toBe(500)
      expect(response.error.code).toBe(ErrorCode.INTERNAL_ERROR)
    })

    it('should handle unknown errors', () => {
      const { response, statusCode } = formatErrorResponse('string error')

      expect(statusCode).toBe(500)
      expect(response.error.code).toBe(ErrorCode.INTERNAL_ERROR)
      expect(response.error.message).toBe('An unexpected error occurred')
    })

    it('should include timestamp in all responses', () => {
      const error = ApiErrors.notFound()
      const { response } = formatErrorResponse(error)

      expect(response.error.timestamp).toBeDefined()
      expect(new Date(response.error.timestamp).getTime()).toBeGreaterThan(0)
    })
  })
})
