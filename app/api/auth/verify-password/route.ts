import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit, authRateLimiters } from '@/src/lib/rate-limit'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

async function handlePasswordVerification(request: NextRequest): Promise<Response> {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { valid: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get service role key for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { valid: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Verify the user is authenticated with the current session
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !currentUser) {
      return NextResponse.json({ valid: false, error: 'User not authenticated' }, { status: 401 })
    }

    // Ensure the email matches the current user (security check)
    if (currentUser.email !== email) {
      return NextResponse.json({ valid: false, error: 'Email mismatch' }, { status: 403 })
    }

    // Create admin client for password verification
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Attempt to sign in with the provided credentials using admin client
    // This doesn't create a session, just verifies the password
    const { error: signInError } = await adminSupabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      // Password is incorrect or other auth error
      return NextResponse.json({
        valid: false,
        error: 'Current password is incorrect',
      })
    }

    // Password is valid
    return NextResponse.json({
      valid: true,
      error: null,
    })
  } catch (error) {
    console.error('Password verification error:', error)
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 })
  }
}

// Apply rate limiting to the endpoint
export const POST = withRateLimit(authRateLimiters.passwordVerification, handlePasswordVerification)
