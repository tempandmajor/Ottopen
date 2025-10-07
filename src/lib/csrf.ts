import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

/**
 * CSRF Protection Implementation
 *
 * Uses the Double Submit Cookie pattern:
 * 1. Server sets a random token in a cookie
 * 2. Client must send the same token in a request header
 * 3. Server validates they match
 */

const CSRF_TOKEN_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a random CSRF token
 */
export function generateCsrfToken(): string {
  // Generate cryptographically secure random token
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Get CSRF token from cookies or create new one
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_TOKEN_NAME)?.value

  if (!token) {
    token = generateCsrfToken()
    cookieStore.set(CSRF_TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })
  }

  return token
}

/**
 * Validate CSRF token from request
 *
 * @param request - Next.js request object
 * @returns true if valid, false otherwise
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  // GET, HEAD, OPTIONS requests don't need CSRF protection
  const method = request.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true
  }

  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  // Both must exist and match
  if (!cookieToken || !headerToken) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(cookieToken, headerToken)
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * CSRF Protection Middleware
 * Use this in API routes that modify data
 */
export async function csrfProtection(request: NextRequest): Promise<Response | null> {
  const isValid = await validateCsrfToken(request)

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return null // Valid - continue to handler
}

/**
 * Hook to get CSRF token for client-side use
 * Add this endpoint: /api/csrf-token
 */
export async function getCsrfTokenForClient(): Promise<string> {
  return await getCsrfToken()
}
