'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = '/auth/signin' }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const redirectingRef = useRef(false)

  console.log('ProtectedRoute - userExists:', !!user, 'loading:', loading)

  useEffect(() => {
    if (!loading && !user) {
      // Avoid redirecting to the same path and avoid multiple triggers
      if (!redirectingRef.current && pathname !== redirectTo) {
        console.log('ProtectedRoute: No user, redirecting to', redirectTo)
        redirectingRef.current = true
        router.replace(redirectTo)
      }
    } else {
      // Reset when user becomes available or loading resumes
      redirectingRef.current = false
    }
  }, [user, loading, router, redirectTo, pathname])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If no user after loading is complete, don't render anything (redirect is happening)
  if (!user) {
    return null
  }

  // User is authenticated, render the protected content
  return <>{children}</>
}

export function PublicOnlyRoute({ children, redirectTo = '/feed' }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const redirectingRef = useRef(false)

  console.log('PublicOnlyRoute - userExists:', !!user, 'loading:', loading)

  useEffect(() => {
    if (!loading && user) {
      if (!redirectingRef.current && pathname !== redirectTo) {
        console.log('PublicOnlyRoute: User exists, redirecting to', redirectTo)
        redirectingRef.current = true
        router.replace(redirectTo)
      }
    } else {
      redirectingRef.current = false
    }
  }, [user, loading, router, redirectTo, pathname])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If user exists after loading is complete, don't render anything (redirect is happening)
  if (user) {
    return null
  }

  // No user, render the public content
  return <>{children}</>
}
