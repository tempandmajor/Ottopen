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

    const response = NextResponse.json({ ok: true }, { status: 200 })

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

    // Harden cookies for persistence across restarts and subdomains
    try {
      const hostname = request.nextUrl.hostname
      const isLocal = hostname === 'localhost' || /^(\d+\.){3}\d+$/.test(hostname)
      const apex = hostname.split('.').slice(-2).join('.')
      const domain = isLocal ? undefined : apex
      const maxAge = 60 * 60 * 24 * 90 // 90 days

      // Re-set Supabase cookies with explicit attributes
      const cookiesSet = response.cookies.getAll()
      cookiesSet
        .filter(c => c.name.startsWith('sb-'))
        .forEach(c => {
          response.cookies.set({
            name: c.name,
            value: c.value,
            httpOnly: true,
            secure: !isLocal,
            sameSite: 'lax',
            path: '/',
            ...(domain ? { domain } : {}),
            maxAge,
          })
        })
    } catch (_) {
      // Best-effort hardening; ignore failures
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
