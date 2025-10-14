import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

/**
 * PATCH /api/users/me/onboarding
 * Body: { completed: boolean }
 * Requires authenticated user; updates users.onboarding_completed
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient() as any

    // Get current session user
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser()

    if (sessionError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const completed = !!body?.completed

    const { data, error } = await supabase
      .from('users')
      .update({ onboarding_completed: completed })
      .eq('id', user.id)
      .select('id, onboarding_completed')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
