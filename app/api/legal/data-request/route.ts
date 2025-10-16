import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import logger from '@/src/lib/logger'

/**
 * POST /api/legal/data-request
 * Submit a GDPR/CCPA data subject request
 */
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()
  const { requesterEmail, requesterName, requestType, requestDetails, regulation } = body

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Find user ID by email
  let userId = user?.id || null
  if (!userId && requesterEmail) {
    const { data: foundUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', requesterEmail)
      .single()
    userId = foundUser?.id || null
  }

  try {
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    const { data, error } = await supabase
      .from('data_subject_requests')
      .insert({
        user_id: userId,
        requester_email: requesterEmail,
        requester_name: requesterName,
        request_type: requestType,
        request_details: requestDetails,
        regulation: regulation || 'BOTH',
        verification_token: verificationToken,
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Send verification email with token

    return NextResponse.json(
      {
        request: data,
        message: 'Request submitted. Please check your email to verify.',
      },
      { status: 201 }
    )
  } catch (error: any) {
    logger.error('Error submitting data request:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/legal/data-request
 * Get data subject requests (user or admin)
 */
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'all'

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('data_subject_requests')
      .select('*')
      .order('created_at', { ascending: false })

    // Non-admins can only see their own requests
    if (!userData?.is_admin) {
      query = query.eq('user_id', user.id)
    }

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: requests, error } = await query

    if (error) throw error

    return NextResponse.json({ requests })
  } catch (error: any) {
    logger.error('Error fetching data requests:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
