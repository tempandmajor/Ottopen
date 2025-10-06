import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * POST /api/admin/moderation/actions
 * Create a moderation action (ban, mute, warning, timeout)
 */
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()
  const { userId, clubId, actionType, reason, durationMinutes } = body

  // Check admin permissions
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!userData?.is_admin) {
    // Check if user is a club moderator
    if (clubId) {
      const { data: membership } = await supabase
        .from('club_memberships')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!membership || !['owner', 'moderator'].includes(membership.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    const expiresAt = durationMinutes
      ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
      : null

    const { data, error } = await supabase
      .from('user_moderation_actions')
      .insert({
        user_id: userId,
        club_id: clubId,
        moderator_id: user.id,
        action_type: actionType,
        reason,
        duration_minutes: durationMinutes,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ action: data })
  } catch (error: any) {
    console.error('Error creating moderation action:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/admin/moderation/actions
 * List moderation actions
 */
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const clubId = searchParams.get('clubId')
  const userId = searchParams.get('userId')

  // Check admin permissions
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!userData?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    let query = supabase
      .from('active_moderation_actions')
      .select('*')
      .order('created_at', { ascending: false })

    if (clubId) {
      query = query.eq('club_id', clubId)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: actions, error } = await query

    if (error) throw error

    return NextResponse.json({ actions })
  } catch (error: any) {
    console.error('Error fetching moderation actions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/moderation/actions
 * Revoke a moderation action
 */
export async function PATCH(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()
  const { actionId } = body

  // Check admin permissions
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!userData?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { data, error } = await supabase
      .from('user_moderation_actions')
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
      })
      .eq('id', actionId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ action: data })
  } catch (error: any) {
    console.error('Error revoking moderation action:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
