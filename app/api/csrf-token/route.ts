import { NextResponse } from 'next/server'
import { getCsrfToken } from '@/src/lib/csrf'

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic'

/**
 * GET /api/csrf-token
 *
 * Returns CSRF token for client-side use
 * Client should include this in X-CSRF-Token header for POST/PUT/DELETE requests
 */
export async function GET() {
  try {
    const token = await getCsrfToken()

    return NextResponse.json({ csrfToken: token })
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 })
  }
}
