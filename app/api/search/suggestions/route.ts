import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const supabase = createServerSupabaseClient()

    // Get suggestions from the database using the function
    const { data, error } = await supabase.rpc('get_search_suggestions', {
      search_prefix: query.toLowerCase(),
      suggestion_limit: 5,
    })

    if (error) {
      logger.error('Suggestions query error:', error)
      return NextResponse.json([])
    }

    const suggestions =
      data?.map((item: any) => ({
        text: item.suggestion_text,
        type: item.suggestion_type,
        count: item.search_count,
      })) || []

    return NextResponse.json(suggestions)
  } catch (error) {
    logger.error('Search suggestions error:', error)
    return NextResponse.json([])
  }
}
