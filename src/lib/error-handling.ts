/**
 * Error handling utilities for API routes
 * Ensures error messages don't leak sensitive information in production
 */

/**
 * Sanitizes error messages for production
 * - Development: Returns full error message for debugging
 * - Production: Returns generic message, logs details server-side
 *
 * @param error - The error object
 * @param fallbackMessage - Generic message to show in production
 * @returns Sanitized error message safe for client
 */
export function getSafeErrorMessage(error: unknown, fallbackMessage: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development'

  // In development, return full error details
  if (isDevelopment) {
    if (error instanceof Error) {
      return error.message
    }
    return String(error)
  }

  // In production, return generic message
  // (actual error is still logged via console.error elsewhere)
  return fallbackMessage
}

/**
 * Creates a standardized error response for API routes
 *
 * @param error - The error object
 * @param fallbackMessage - Generic message to show in production
 * @returns Error response object
 */
export function createErrorResponse(error: unknown, fallbackMessage: string) {
  return {
    error: getSafeErrorMessage(error, fallbackMessage),
  }
}
