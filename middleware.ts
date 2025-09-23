import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = [
    '/feed',
    '/messages',
    '/settings',
    '/profile',
  ];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // For now, we'll just allow all routes through since auth isn't implemented
  // In a real implementation, you would:
  // 1. Check for authentication token/session
  // 2. Redirect to /auth/signin if not authenticated
  // 3. Allow access if authenticated

  if (isProtectedRoute) {
    // Example authentication check (commented out since auth isn't implemented):
    // const token = request.cookies.get('auth-token');
    // if (!token) {
    //   return NextResponse.redirect(new URL('/auth/signin', request.url));
    // }

    // For demo purposes, we'll add a header to indicate this route should be protected
    const response = NextResponse.next();
    response.headers.set('X-Protected-Route', 'true');
    return response;
  }

  return NextResponse.next();
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