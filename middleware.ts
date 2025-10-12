import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import logger from './src/lib/logger'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl === 'https://your-project.supabase.co' ||
    supabaseAnonKey === 'your_anon_key_here'
  ) {
    logger.warn('Supabase not configured - skipping auth checks')
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Update the request cookies
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Create a new response to ensure cookies are set
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Set the cookie on the response
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          // Update the request cookies
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Create a new response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Remove the cookie from the response
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    })

    // Get the session to refresh cookies if needed
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Use session.user instead of getUser() for better reliability
    const user = session?.user

    const { pathname } = request.nextUrl

    // Protected routes that require authentication
    const protectedRoutes = [
      '/dashboard',
      '/feed',
      '/messages',
      '/settings',
      '/profile',
      '/referrals',
      '/submissions',
      '/opportunities',
      '/admin',
    ]

    // Public-only routes (redirect to dashboard if authenticated)
    const publicOnlyRoutes = ['/auth/signin', '/auth/signup', '/auth/forgot-password']

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    const isPublicOnlyRoute = publicOnlyRoutes.some(route => pathname.startsWith(route))

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !user) {
      logger.info('Redirecting unauthenticated user', { pathname })
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Redirect authenticated users from public-only routes
    if (isPublicOnlyRoute && user) {
      logger.info('Redirecting authenticated user from public route', { pathname })
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (error) {
    logger.error('Middleware error:', error instanceof Error ? error : new Error(String(error)), {
      pathname: request.nextUrl.pathname,
    })

    // For protected routes, redirect to signin on auth errors
    const { pathname } = request.nextUrl
    const protectedRoutes = [
      '/dashboard',
      '/feed',
      '/messages',
      '/settings',
      '/profile',
      '/referrals',
      '/submissions',
      '/opportunities',
      '/admin',
    ]

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    if (isProtectedRoute) {
      logger.warn('Auth error on protected route - redirecting to signin', { pathname })
      return NextResponse.redirect(new URL('/auth/signin?error=auth-failed', request.url))
    }

    // For public routes, allow through
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
