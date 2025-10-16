import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import logger from '@/src/lib/logger'

/**
 * POST /api/legal/dmca/counter-notice
 * Submit a DMCA counter notice
 */
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()
  const {
    dmcaNoticeId,
    userName,
    userEmail,
    userAddress,
    userPhone,
    goodFaithStatement,
    consentToJurisdiction,
    accuracyStatement,
    signature,
    signatureDate,
  } = body

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify user owns the content
    const { data: notice } = await supabase
      .from('dmca_notices')
      .select('content_owner_id')
      .eq('id', dmcaNoticeId)
      .single()

    if (!notice || notice.content_owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('dmca_counter_notices')
      .insert({
        dmca_notice_id: dmcaNoticeId,
        user_id: user.id,
        user_name: userName,
        user_email: userEmail,
        user_address: userAddress,
        user_phone: userPhone,
        good_faith_statement: goodFaithStatement,
        consent_to_jurisdiction: consentToJurisdiction,
        accuracy_statement: accuracyStatement,
        signature,
        signature_date: signatureDate,
      })
      .select()
      .single()

    if (error) throw error

    // Update DMCA notice status
    await supabase
      .from('dmca_notices')
      .update({
        status: 'counter_noticed',
        counter_notice_id: data.id,
      })
      .eq('id', dmcaNoticeId)

    return NextResponse.json({ counterNotice: data }, { status: 201 })
  } catch (error: any) {
    logger.error('Error submitting counter notice:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
