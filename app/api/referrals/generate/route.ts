import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { nanoid } from 'nanoid'
import logger from '@/src/lib/logger'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

/**
 * POST /api/referrals/generate
 * Generate a referral code for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has an active referral code
    const { data: existingCode } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (existingCode) {
      return NextResponse.json({
        success: true,
        referral_code: existingCode,
      })
    }

    // Generate unique referral code
    const code = nanoid(10).toUpperCase()

    // Create referral code
    const { data: newCode, error: createError } = await supabase
      .from('referral_codes')
      .insert({
        user_id: user.id,
        code,
        is_active: true,
        uses_count: 0,
      })
      .select()
      .single()

    if (createError) {
      logger.error('Error creating referral code:', createError)
      return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      referral_code: newCode,
    })
  } catch (error) {
    logger.error('Error in generate referral:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
