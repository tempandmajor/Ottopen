import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/src/lib/database'
import { getServerUser } from '@/lib/server/auth'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { logError } from '@/src/lib/errors'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // SEC-FIX: Require authentication and admin role
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const supabase = createServerSupabaseClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Update application statistics
    const success = await dbService.updateApplicationStatistics()

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Application statistics updated successfully',
        updatedAt: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update statistics' },
        { status: 500 }
      )
    }
  } catch (error) {
    logError(error, { context: 'update_stats' })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// Allow GET requests for health checks
export async function GET() {
  return NextResponse.json({
    endpoint: 'update-stats',
    description: 'Updates application-wide statistics (Admin only)',
    methods: ['POST'],
  })
}
