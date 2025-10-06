import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * POST /api/legal/dmca/notice
 * Submit a DMCA takedown notice
 */
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()
  const {
    complainantName,
    complainantEmail,
    complainantAddress,
    complainantPhone,
    contentType,
    contentId,
    contentUrl,
    copyrightedWorkDescription,
    originalWorkLocation,
    infringementDescription,
    goodFaithStatement,
    accuracyStatement,
    signature,
    signatureDate,
  } = body

  try {
    // Find content owner
    let contentOwnerId = null
    if (contentType === 'manuscript') {
      const { data: manuscript } = await supabase
        .from('manuscripts')
        .select('user_id')
        .eq('id', contentId)
        .single()
      contentOwnerId = manuscript?.user_id
    }

    const { data, error } = await supabase
      .from('dmca_notices')
      .insert({
        complainant_name: complainantName,
        complainant_email: complainantEmail,
        complainant_address: complainantAddress,
        complainant_phone: complainantPhone,
        content_type: contentType,
        content_id: contentId,
        content_url: contentUrl,
        copyrighted_work_description: copyrightedWorkDescription,
        original_work_location: originalWorkLocation,
        infringement_description: infringementDescription,
        good_faith_statement: goodFaithStatement,
        accuracy_statement: accuracyStatement,
        signature,
        signature_date: signatureDate,
        content_owner_id: contentOwnerId,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ notice: data }, { status: 201 })
  } catch (error: any) {
    console.error('Error submitting DMCA notice:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/legal/dmca/notice
 * Get DMCA notices (admin or content owner)
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

    let query = supabase.from('dmca_notices').select('*').order('created_at', { ascending: false })

    // Non-admins can only see their own content notices
    if (!userData?.is_admin) {
      query = query.eq('content_owner_id', user.id)
    }

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: notices, error } = await query

    if (error) throw error

    return NextResponse.json({ notices })
  } catch (error: any) {
    console.error('Error fetching DMCA notices:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
