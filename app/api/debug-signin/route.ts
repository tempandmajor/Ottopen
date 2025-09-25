import { NextResponse } from 'next/server'
import { supabase } from '@/src/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    console.log('=== DEBUG SIGNIN API ===')
    console.log('Email:', email)
    console.log('Attempting signin...')

    // Test signin with the same logic as authService
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('Signin result:', {
      hasUser: !!data.user,
      hasSession: !!data.session,
      error: error?.message,
      userId: data.user?.id,
      userEmail: data.user?.email,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message })
    }

    // Test getting current user profile
    if (data.user) {
      console.log('Testing profile fetch...')
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      console.log('Profile result:', {
        hasProfile: !!profile,
        error: profileError?.message,
        profile: profile
          ? {
              id: profile.id,
              email: profile.email,
              display_name: profile.display_name,
              username: profile.username,
            }
          : null,
      })
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: !!data.session,
    })
  } catch (error) {
    console.error('Debug signin error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    )
  }
}
