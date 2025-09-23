import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey ||
      supabaseUrl === 'https://your-project.supabase.co' ||
      supabaseAnonKey === 'your_anon_key_here') {
    // Supabase not configured, skip auth checks
    return response
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Protected routes that require authentication
    const protectedRoutes = [
      '/dashboard',
      '/feed',
      '/messages',
      '/settings',
      '/profile',
    ]

    // Public-only routes (redirect to dashboard if authenticated)
    const publicOnlyRoutes = [
      '/auth/signin',
      '/auth/signup',
      '/auth/forgot-password',
    ]

    const isProtectedRoute = protectedRoutes.some(route =>
      pathname.startsWith(route)
    )

    const isPublicOnlyRoute = publicOnlyRoutes.some(route =>
      pathname.startsWith(route)
    )

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Redirect authenticated users from public-only routes
    if (isPublicOnlyRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (error) {
    // If Supabase auth check fails, just continue without auth protection
    console.error('Middleware error:', error)
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
};