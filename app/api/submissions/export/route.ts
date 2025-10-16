export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const userId = searchParams.get('userId') || user.id

    // Get submissions with manuscript data
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(
        `
        *,
        manuscript:manuscripts(*)
      `
      )
      .eq('submitter_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Submissions error:', error)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Submission ID',
        'Title',
        'Type',
        'Genre',
        'Status',
        'Submitted Date',
        'Page Count',
        'Rating',
        'Logline',
      ]

      const rows = submissions?.map(sub => [
        sub.id,
        sub.manuscript?.title || '',
        sub.manuscript?.type || '',
        sub.manuscript?.genre || '',
        sub.status,
        new Date(sub.created_at).toLocaleDateString(),
        sub.manuscript?.page_count || '',
        sub.internal_rating || '',
        sub.manuscript?.logline || '',
      ])

      const csv = [
        headers.join(','),
        ...(rows?.map(row => row.map(cell => `"${cell}"`).join(',')) || []),
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="submissions-${Date.now()}.csv"`,
        },
      })
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(submissions, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="submissions-${Date.now()}.json"`,
        },
      })
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  } catch (error) {
    logger.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
