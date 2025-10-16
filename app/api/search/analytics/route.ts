import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query,
      results_count,
      clicked_result_id,
      clicked_result_type,
      filters,
      search_duration_ms,
    } = body

    const supabase = createServerSupabaseClient()

    // Get current user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Generate session ID from headers or create new one
    const sessionId = request.headers.get('x-session-id') || crypto.randomUUID()

    // Log search analytics
    const { error } = await supabase.from('search_analytics').insert({
      query,
      user_id: user?.id,
      results_count,
      clicked_result_id,
      clicked_result_type,
      session_id: sessionId,
      search_duration_ms,
      filters: filters || null,
    })

    if (error) {
      logger.error('Analytics insert error:', error)
    }

    return NextResponse.json({ success: true, session_id: sessionId })
  } catch (error) {
    logger.error('Search analytics error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
