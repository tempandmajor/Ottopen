/**
 * XSS Protection - Sanitize user-generated content
 *
 * Uses DOMPurify (client-side only) to remove malicious scripts while preserving safe HTML
 * Note: These functions return unsanitized content on the server and only sanitize in the browser
 */

// Lazy load DOMPurify only in browser
let DOMPurify: any = null
if (typeof window !== 'undefined') {
  DOMPurify = require('dompurify')
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * Client-side only - returns original content on server
 *
 * @param dirty - Raw HTML content from user
 * @param options - DOMPurify configuration options
 * @returns Sanitized safe HTML (client) or original (server)
 */
export function sanitizeHtml(
  dirty: string,
  options?: {
    allowedTags?: string[]
    allowedAttributes?: Record<string, string[]>
  }
): string {
  if (!dirty) return ''

  // Server-side: return as-is (will be sanitized on client)
  if (typeof window === 'undefined' || !DOMPurify) {
    return dirty
  }

  // Type assertion for DOMPurify config to bypass strict typing
  const config = {
    ALLOWED_TAGS: options?.allowedTags || [
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
    ],
    ALLOWED_ATTR: options?.allowedAttributes || {
      a: ['href', 'title', 'target'],
      code: ['class'],
    },
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  } as any

  return DOMPurify.sanitize(dirty, config) as unknown as string
}

/**
 * Sanitize plain text - strips all HTML
 * Client-side only - returns original content on server
 *
 * @param dirty - Raw text from user
 * @returns Plain text with HTML stripped (client) or original (server)
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return ''

  // Server-side: return as-is (will be sanitized on client)
  if (typeof window === 'undefined' || !DOMPurify) {
    return dirty
  }

  const config = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  } as any

  return DOMPurify.sanitize(dirty, config) as unknown as string
}

/**
 * Sanitize for rich text editor output
 * Client-side only - returns original content on server
 *
 * @param dirty - Rich text editor HTML
 * @returns Sanitized HTML safe for display (client) or original (server)
 */
export function sanitizeRichText(dirty: string): string {
  if (!dirty) return ''

  // Server-side: return as-is (will be sanitized on client)
  if (typeof window === 'undefined' || !DOMPurify) {
    return dirty
  }

  const config = {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'del',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'hr',
      'div',
      'span',
    ],
    ALLOWED_ATTR: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      code: ['class'],
      span: ['class', 'style'],
      div: ['class', 'style'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    ALLOW_DATA_ATTR: false,
  } as any

  return DOMPurify.sanitize(dirty, config) as unknown as string
}

/**
 * React component helper for rendering sanitized HTML
 *
 * Usage:
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
 */
export function createSafeMarkup(dirty: string) {
  return {
    __html: sanitizeHtml(dirty),
  }
}

/**
 * Validate and sanitize URL to prevent javascript: and data: protocols
 *
 * @param url - User-provided URL
 * @returns Safe URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  // Remove whitespace
  url = url.trim()

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  const lowerUrl = url.toLowerCase()

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return ''
    }
  }

  // Ensure URL has valid protocol or is relative
  if (!url.match(/^(https?:)?\/\//i) && !url.startsWith('/')) {
    // Prepend https:// for domain-only URLs
    url = `https://${url}`
  }

  return url
}
