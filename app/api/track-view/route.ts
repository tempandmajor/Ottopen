import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/src/lib/database'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId } = body

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Get user from session if authenticated
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // Get IP address and user agent for anonymous tracking
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : request.ip
    const userAgent = request.headers.get('user-agent')

    // Track the view
    await dbService.trackPostView(
      postId,
      user?.id,
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      success: true,
      message: 'View tracked successfully'
    })
  } catch (error) {
    console.error('Error tracking post view:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'track-view',
    description: 'Tracks post views for analytics',
    methods: ['POST'],
    requiredFields: ['postId']
  })
}