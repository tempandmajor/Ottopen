import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET - List events
async function handleGetEvents(request: NextRequest, { params }: { params: { clubId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'upcoming'

    const supabase = createServerSupabaseClient()

    let query = supabase
      .from('club_events')
      .select(
        `
        *,
        created_by:created_by_id(id, name),
        rsvp_count:event_rsvps(count),
        user_rsvp:event_rsvps!inner(id)
      `
      )
      .eq('club_id', params.clubId)

    if (filter === 'upcoming') {
      query = query.gte('start_time', new Date().toISOString())
    } else {
      query = query.lt('start_time', new Date().toISOString())
    }

    query = query.order('start_time', { ascending: filter === 'upcoming' })

    const { data: events, error } = await query

    if (error) throw error

    const transformedEvents = events?.map(event => ({
      ...event,
      rsvp_count: event.rsvp_count?.[0]?.count || 0,
      user_rsvp: !!event.user_rsvp?.length,
    }))

    return NextResponse.json({
      success: true,
      events: transformedEvents,
    })
  } catch (error: any) {
    console.error('Get events error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = createRateLimitedHandler('api', handleGetEvents)

// POST - Create event
async function handleCreateEvent(request: NextRequest, { params }: { params: { clubId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      eventType,
      locationType,
      locationDetails,
      startTime,
      endTime,
      maxParticipants,
    } = body

    if (!title || !description || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Check membership
    const { data: membership } = await supabase
      .from('club_memberships')
      .select('id')
      .eq('club_id', params.clubId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a club member' }, { status: 403 })
    }

    // Create event
    const { data: event, error } = await supabase
      .from('club_events')
      .insert({
        club_id: params.clubId,
        created_by_id: user.id,
        title,
        description,
        event_type: eventType,
        location_type: locationType,
        location_details: locationDetails,
        start_time: startTime,
        end_time: endTime,
        max_participants: maxParticipants,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      event,
    })
  } catch (error: any) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { error: 'Failed to create event', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = createRateLimitedHandler('api', handleCreateEvent)
