import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * GET /api/admin/moderation/reports
 * List content reports for moderation
 */
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending'
  const clubId = searchParams.get('clubId')

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
    let query = supabase
      .from('content_reports')
      .select(
        `
        *,
        reporter:users!reporter_id(id, display_name, email, username),
        reviewer:users!reviewed_by(id, display_name)
      `
      )
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (clubId) {
      query = query.eq('club_id', clubId)
    }

    const { data: reports, error } = await query

    if (error) throw error

    return NextResponse.json({ reports })
  } catch (error: any) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/moderation/reports
 * Update a content report
 */
export async function PATCH(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()
  const { reportId, status, resolution_notes } = body

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
      .from('content_reports')
      .update({
        status,
        resolution_notes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ report: data })
  } catch (error: any) {
    console.error('Error updating report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
