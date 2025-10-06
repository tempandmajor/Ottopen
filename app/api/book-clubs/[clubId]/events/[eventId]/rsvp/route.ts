import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function handleRSVP(
  request: NextRequest,
  { params }: { params: { clubId: string; eventId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Check if already RSVPed
    const { data: existingRSVP } = await supabase
      .from('event_rsvps')
      .select('id')
      .eq('event_id', params.eventId)
      .eq('user_id', user.id)
      .single()

    if (existingRSVP) {
      // Cancel RSVP
      const { error } = await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', params.eventId)
        .eq('user_id', user.id)

      if (error) throw error

      return NextResponse.json({
        success: true,
        action: 'cancelled',
      })
    } else {
      // Create RSVP
      const { error } = await supabase.from('event_rsvps').insert({
        event_id: params.eventId,
        user_id: user.id,
      })

      if (error) throw error

      return NextResponse.json({
        success: true,
        action: 'rsvped',
      })
    }
  } catch (error: any) {
    console.error('RSVP error:', error)
    return NextResponse.json({ error: 'Failed to RSVP', details: error.message }, { status: 500 })
  }
}

export const POST = createRateLimitedHandler('api', handleRSVP)
