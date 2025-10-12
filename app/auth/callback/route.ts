import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/signin?error=${encodeURIComponent(exchangeError.message)}`
        )
      }

      if (data.session) {
        // Check if user profile exists in our database
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        // If no profile exists, create one from OAuth data
        if (profileError || !profile) {
          const userMetadata = data.user.user_metadata
          const email = data.user.email || ''
          const displayName = userMetadata.full_name || userMetadata.name || email.split('@')[0]
          const username = email
            .split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')

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
            console.error('Profile creation error:', insertError)
            // Don't fail the auth flow if profile creation fails
            // User can complete profile later
          }
        }

        // Redirect to feed on successful authentication
        return NextResponse.redirect(`${requestUrl.origin}/feed`)
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=authentication_failed`)
    }
  }

  // If no code or error, redirect to signin
  return NextResponse.redirect(`${requestUrl.origin}/auth/signin`)
}
