import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

async function handleSetSession(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json({ ok: false, error: 'Missing tokens' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 })
    }

    let response = NextResponse.json({ ok: true }, { status: 200 })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    })

    // This sets the Supabase auth cookies on the response
    const { error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    return response
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export const POST = createRateLimitedHandler('auth', handleSetSession)
