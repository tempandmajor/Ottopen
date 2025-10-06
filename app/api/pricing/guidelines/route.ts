import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { logError } from '@/src/lib/errors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/pricing/guidelines
 * Get industry-standard pricing guidelines for ghostwriters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const experience_level = searchParams.get('experience_level')
    const pricing_model = searchParams.get('pricing_model')

    let query = supabase
      .from('pricing_guidelines')
      .select('*')
      .order('experience_level', { ascending: true })

    if (experience_level) {
      query = query.eq('experience_level', experience_level)
    }

    if (pricing_model) {
      query = query.eq('pricing_model', pricing_model)
    }

    const { data: guidelines, error } = await query

    if (error) {
      logError('Error fetching pricing guidelines:', error)
      return NextResponse.json({ error: 'Failed to fetch pricing guidelines' }, { status: 500 })
    }

    return NextResponse.json({ guidelines })
  } catch (error: unknown) {
    logError(error, { context: 'pricing_guidelines_api' })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}
