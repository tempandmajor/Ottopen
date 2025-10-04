/**
 * Custom error classes for consistent error handling
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'AUTHENTICATION_ERROR', 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 'AUTHORIZATION_ERROR', 403)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

export class RateLimitError extends AppError {
  constructor(public retryAfter?: number) {
    super('Too many requests', 'RATE_LIMIT_EXCEEDED', 429)
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string,
    public originalError?: any
  ) {
    super(message, 'DATABASE_ERROR', 500, false)
  }
}

export class ExternalAPIError extends AppError {
  constructor(
    service: string,
    message: string,
    public originalError?: any
  ) {
    super(`${service} API error: ${message}`, 'EXTERNAL_API_ERROR', 502, false)
  }
}

/**
 * Format error for client response
 */
export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      ...(error instanceof ValidationError && error.details ? { details: error.details } : {}),
      ...(error instanceof RateLimitError && error.retryAfter
        ? { retryAfter: error.retryAfter }
        : {}),
    }
  }

  // Unknown errors - don't leak details
  return {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  }
}

/**
 * Safe error logging that redacts sensitive information
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'apiKey',
    'api_key',
    'accessToken',
    'refreshToken',
  ]

  const redact = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj

    const redacted: any = Array.isArray(obj) ? [] : {}
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        redacted[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = redact(value)
      } else {
        redacted[key] = value
      }
    }
    return redacted
  }

  const errorInfo = {
    message: error instanceof Error ? error.message : 'Unknown error',
    name: error instanceof Error ? error.name : 'Error',
    code: error instanceof AppError ? error.code : undefined,
    statusCode: error instanceof AppError ? error.statusCode : undefined,
    isOperational: error instanceof AppError ? error.isOperational : false,
    stack: error instanceof Error ? error.stack : undefined,
    context: context ? redact(context) : undefined,
  }

  // In production, use your logging service (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to logging service
    console.error('[ERROR]', JSON.stringify(errorInfo))
  } else {
    console.error('[ERROR]', errorInfo)
  }

  return errorInfo
}
