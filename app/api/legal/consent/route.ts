import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import logger from '@/src/lib/logger'

/**
 * POST /api/legal/consent
 * Update user consent preferences
 */
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()
  const { consentType, granted, consentText, consentVersion, ipAddress, userAgent } = body

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('user_consents')
      .upsert(
        {
          user_id: user.id,
          consent_type: consentType,
          granted,
          consent_text: consentText,
          consent_version: consentVersion,
          consent_method: granted ? 'explicit' : 'opt_out',
          ip_address: ipAddress,
          user_agent: userAgent,
          granted_at: granted ? new Date().toISOString() : null,
          revoked_at: !granted ? new Date().toISOString() : null,
        },
        {
          onConflict: 'user_id,consent_type',
        }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ consent: data })
  } catch (error: any) {
    logger.error('Error updating consent:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/legal/consent
 * Get user consent preferences
 */
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: consents, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ consents })
  } catch (error: any) {
    logger.error('Error fetching consents:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
