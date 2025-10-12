import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  console.log('[OAuth Callback] Starting callback handler', {
    hasCode: !!code,
    hasError: !!error,
    url: requestUrl.href,
  })

  // Handle OAuth errors
  if (error) {
    console.error('[OAuth Callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      console.log('[OAuth Callback] Exchanging code for session...')
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      console.log('[OAuth Callback] Exchange result:', {
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        error: exchangeError?.message,
      })

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/signin?error=${encodeURIComponent(exchangeError.message)}`
        )
      }

      if (data.session) {
        console.log('[OAuth Callback] Session created successfully:', {
          userId: data.user.id,
          email: data.user.email,
        })

        // Check if user profile exists in our database
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        console.log('[OAuth Callback] Profile check:', {
          profileExists: !!profile,
          profileError: profileError?.message,
        })

        // If no profile exists, create one from OAuth data
        if (profileError || !profile) {
          const userMetadata = data.user.user_metadata
          const email = data.user.email || ''
          const displayName = userMetadata.full_name || userMetadata.name || email.split('@')[0]
          const username = email
            .split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')

          console.log('[OAuth Callback] Creating new profile:', {
            userId: data.user.id,
            email,
            displayName,
            username,
          })

          // Create user profile
          const { error: insertError } = await supabase.from('users').insert({
            id: data.user.id,
            email: email,
            display_name: displayName,
            username: username,
            avatar_url: userMetadata.avatar_url || userMetadata.picture,
            account_type: 'writer',
            account_tier: 'free',
            verification_status: 'verified', // OAuth users are pre-verified
            bio: '',
            specialty: '',
          })

          if (insertError) {
            console.error('[OAuth Callback] Profile creation error:', insertError)
            // Don't fail the auth flow if profile creation fails
            // User can complete profile later
          } else {
            console.log('[OAuth Callback] Profile created successfully')
          }
        }

        // Redirect to feed on successful authentication
        console.log('[OAuth Callback] Redirecting to /feed')
        return NextResponse.redirect(`${requestUrl.origin}/feed`)
      } else {
        console.error('[OAuth Callback] No session in exchange data')
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=authentication_failed`)
    }
  }

  // If no code or error, redirect to signin
  return NextResponse.redirect(`${requestUrl.origin}/auth/signin`)
}
