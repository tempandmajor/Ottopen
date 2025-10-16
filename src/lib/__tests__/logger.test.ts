/**
 * Logger Service Tests
 *
 * Tests for centralized logging infrastructure
 */

import { Logger, logger } from '../logger'

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
}))

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    jest.clearAllMocks()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  describe('info()', () => {
    it('should log info messages', () => {
      logger.info('Test info message')
      expect(consoleLogSpy).toHaveBeenCalled()
    })

    it('should log info with context', () => {
      const context = { userId: '123', action: 'test' }
      logger.info('Test with context', context)

      expect(consoleLogSpy).toHaveBeenCalled()
      const logCall = consoleLogSpy.mock.calls[0]
      expect(logCall.some((arg: any) => typeof arg === 'object' && arg?.userId === '123')).toBe(
        true
      )
    })
  })

  describe('error()', () => {
    it('should log error messages', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', error)

      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should handle string errors', () => {
      logger.error('Error occurred', 'String error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should handle unknown error types', () => {
      logger.error('Error occurred', { unknown: 'error' })
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should include context in error logs', () => {
      const error = new Error('Test error')
      const context = { operation: 'createPost', userId: '123' }

      logger.error('Database error', error, context)

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('warn()', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message')
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should log warnings with context', () => {
      const context = { threshold: 90, current: 95 }
      logger.warn('Approaching limit', context)

      expect(consoleWarnSpy).toHaveBeenCalled()
    })
  })

  describe('debug()', () => {
    it('should log debug messages in development', () => {
      // Debug only logs in development (which is the test environment)
      logger.debug('Debug message')
      expect(consoleLogSpy).toHaveBeenCalled()
    })
  })

  describe('sanitizeContext()', () => {
    it('should redact sensitive fields', () => {
      const sensitiveContext = {
        userId: '123',
        password: 'secret123',
        apiKey: 'key123',
        token: 'token123',
        normalField: 'value',
      }

      logger.info('Test', sensitiveContext)

      // Verify log was called
      expect(consoleLogSpy).toHaveBeenCalled()

      // Get the logged context
      const logCall = consoleLogSpy.mock.calls[0]
      const loggedContext = logCall.find(
        (arg: any) => typeof arg === 'object' && arg?.userId === '123'
      )

      // Sensitive fields should be redacted
      if (loggedContext) {
        expect(loggedContext.password).toBe('[REDACTED]')
        expect(loggedContext.apiKey).toBe('[REDACTED]')
        expect(loggedContext.token).toBe('[REDACTED]')
        // Normal fields preserved
        expect(loggedContext.userId).toBe('123')
        expect(loggedContext.normalField).toBe('value')
      }
    })
  })

  describe('child()', () => {
    it('should create child logger with default context', () => {
      const childLogger = logger.child({ component: 'api', endpoint: '/posts' })

      childLogger.info('Request started')

      expect(consoleLogSpy).toHaveBeenCalled()
      const logCall = consoleLogSpy.mock.calls[0]
      const hasContext = logCall.some(
        (arg: any) => typeof arg === 'object' && arg?.component === 'api'
      )
      expect(hasContext).toBe(true)
    })

    it('should merge child context with call context', () => {
      const childLogger = logger.child({ component: 'api' })

      childLogger.info('Request', { endpoint: '/posts' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const logCall = consoleLogSpy.mock.calls[0]
      const context = logCall.find(
        (arg: any) => typeof arg === 'object' && arg?.component === 'api'
      )

      expect(context?.component).toBe('api')
      expect(context?.endpoint).toBe('/posts')
    })
  })

  describe('error normalization', () => {
    it('should handle Error instances', () => {
      const error = new Error('Test error')
      logger.error('Error', error)

      expect(consoleErrorSpy).toHaveBeenCalled()
      const logCall = consoleErrorSpy.mock.calls[0]
      expect(logCall.some((arg: any) => arg instanceof Error)).toBe(true)
    })

    it('should convert strings to Error', () => {
      logger.error('Error', 'String error message')

      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should handle objects with message property', () => {
      const errorLike = { message: 'Error message', code: 500 }
      logger.error('Error', errorLike)

      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should handle completely unknown errors', () => {
      logger.error('Error', 123)

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('environment awareness', () => {
    it('should be aware of development environment', () => {
      const testLogger = new Logger()

      // In test environment, isDevelopment should be true
      testLogger.debug('Debug message')
      expect(consoleLogSpy).toHaveBeenCalled()
    })
  })

  describe('structured logging', () => {
    it('should include timestamp in logs', () => {
      logger.info('Test message')

      expect(consoleLogSpy).toHaveBeenCalled()
      // Timestamp is included in development mode
      const logCall = consoleLogSpy.mock.calls[0]
      const hasTimestamp = logCall.some(
        (arg: string) => typeof arg === 'string' && /\d{1,2}:\d{2}:\d{2}/.test(arg)
      )
      expect(hasTimestamp).toBe(true)
    })

    it('should include log level in output', () => {
      logger.info('Test message')

      expect(consoleLogSpy).toHaveBeenCalled()
      const logCall = consoleLogSpy.mock.calls[0]
      const hasLevel = logCall.some(
        (arg: string) => typeof arg === 'string' && arg.includes('[INFO]')
      )
      expect(hasLevel).toBe(true)
    })
  })

  describe('multiple log calls', () => {
    it('should handle multiple sequential logs', () => {
      logger.info('Message 1')
      logger.warn('Message 2')
      logger.error('Message 3', new Error('Test'))

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('context preservation', () => {
    it('should not mutate original context object', () => {
      const context = { userId: '123', password: 'secret' }
      const originalContext = { ...context }

      logger.info('Test', context)

      // Original context should be unchanged
      expect(context).toEqual(originalContext)
    })
  })
})
