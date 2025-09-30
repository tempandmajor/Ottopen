/**
 * Standardized API error handling
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { monitoring } from './monitoring'
import { isProd } from './env'

export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONFLICT = 'CONFLICT',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

export interface ErrorResponse {
  error: {
    code: ErrorCode
    message: string
    details?: unknown
    path?: string
    timestamp: string
  }
}

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Predefined error creators
export const ApiErrors = {
  badRequest: (message: string, details?: unknown) =>
    new ApiError(ErrorCode.BAD_REQUEST, message, 400, details),

  unauthorized: (message = 'Unauthorized') => new ApiError(ErrorCode.UNAUTHORIZED, message, 401),

  forbidden: (message = 'Forbidden') => new ApiError(ErrorCode.FORBIDDEN, message, 403),

  notFound: (message = 'Resource not found') => new ApiError(ErrorCode.NOT_FOUND, message, 404),

  validationError: (message: string, details?: unknown) =>
    new ApiError(ErrorCode.VALIDATION_ERROR, message, 422, details),

  rateLimitExceeded: (message = 'Rate limit exceeded') =>
    new ApiError(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429),

  conflict: (message: string, details?: unknown) =>
    new ApiError(ErrorCode.CONFLICT, message, 409, details),

  internalError: (message = 'Internal server error') =>
    new ApiError(ErrorCode.INTERNAL_ERROR, message, 500),

  databaseError: (message = 'Database operation failed') =>
    new ApiError(ErrorCode.DATABASE_ERROR, message, 500),

  externalServiceError: (message: string) =>
    new ApiError(ErrorCode.EXTERNAL_SERVICE_ERROR, message, 502),

  notImplemented: (message = 'Not implemented') =>
    new ApiError(ErrorCode.NOT_IMPLEMENTED, message, 501),
}

/**
 * Format error response
 */
export function formatErrorResponse(
  error: unknown,
  path?: string
): { response: ErrorResponse; statusCode: number } {
  const timestamp = new Date().toISOString()

  // Handle ApiError
  if (error instanceof ApiError) {
    return {
      response: {
        error: {
          code: error.code,
          message: error.message,
          details: isProd() ? undefined : error.details,
          path,
          timestamp,
        },
      },
      statusCode: error.statusCode,
    }
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      response: {
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          details: isProd() ? undefined : error.errors,
          path,
          timestamp,
        },
      },
      statusCode: 422,
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    const message = isProd() ? 'Internal server error' : error.message
    return {
      response: {
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message,
          details: isProd() ? undefined : error.stack,
          path,
          timestamp,
        },
      },
      statusCode: 500,
    }
  }

  // Handle unknown errors
  return {
    response: {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        path,
        timestamp,
      },
    },
    statusCode: 500,
  }
}

/**
 * Handle API errors and return NextResponse
 */
export function handleApiError(error: unknown, path?: string): NextResponse<ErrorResponse> {
  const { response, statusCode } = formatErrorResponse(error, path)

  // Log error for monitoring
  if (error instanceof Error) {
    monitoring.captureError(error, {
      action: 'api_error',
      url: path,
      metadata: {
        statusCode,
        errorCode: response.error.code,
      },
    })
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Async handler wrapper that catches errors
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  path?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error, path)
    }
  }
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, statusCode = 200): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, { status: statusCode })
}
