import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Get trending searches from materialized view
    const { data, error } = await supabase
      .from('trending_searches')
      .select('*')
      .order('search_count', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Trending searches error:', error)
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Trending searches error:', error)
    return NextResponse.json([])
  }
}
