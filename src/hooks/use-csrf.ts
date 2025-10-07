import { useEffect, useState } from 'react'

/**
 * Hook to fetch and manage CSRF token
 *
 * Usage:
 * const csrfToken = useCsrfToken()
 *
 * fetch('/api/some-endpoint', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'X-CSRF-Token': csrfToken
 *   },
 *   body: JSON.stringify(data)
 * })
 */
export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string>('')

  useEffect(() => {
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(err => console.error('Failed to fetch CSRF token:', err))
  }, [])

  return csrfToken
}

/**
 * Helper function to add CSRF token to fetch options
 */
export function withCsrfToken(csrfToken: string, options: RequestInit = {}): RequestInit {
  return {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken,
    },
  }
}
