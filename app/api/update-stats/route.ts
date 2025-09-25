import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/src/lib/database'

export async function POST(request: NextRequest) {
  try {
    // Update application statistics
    const success = await dbService.updateApplicationStatistics()

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Application statistics updated successfully',
        updatedAt: new Date().toISOString()
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update statistics' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating application statistics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Allow GET requests for health checks
export async function GET() {
  return NextResponse.json({
    endpoint: 'update-stats',
    description: 'Updates application-wide statistics',
    methods: ['POST']
  })
}