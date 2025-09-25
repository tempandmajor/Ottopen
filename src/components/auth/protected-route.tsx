'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = '/auth/signin' }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  console.log('ProtectedRoute - user:', user ? user.email : 'null', 'loading:', loading)

  useEffect(() => {
    if (!loading && !user) {
      console.log('ProtectedRoute: No user, redirecting to', redirectTo)
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

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

  console.log('PublicOnlyRoute - user:', user ? user.email : 'null', 'loading:', loading)

  useEffect(() => {
    if (!loading && user) {
      console.log('PublicOnlyRoute: User exists, redirecting to', redirectTo)
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

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