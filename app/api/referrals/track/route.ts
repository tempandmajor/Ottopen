import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { validateRequest, trackReferralSchema } from '@/src/lib/validation'
import { logError, formatErrorResponse, ValidationError } from '@/src/lib/errors'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

/**
 * POST /api/referrals/track
 * Track a referral when a new user signs up with a referral code
 * SEC-001: Rate limiting applied
 * SEC-006: Fixed race condition with unique constraint
 */
async function handleTrackReferral(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Validate request body
    const validation = await validateRequest(request, trackReferralSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { referral_code, referred_user_id } = validation.data

    // Find the referral code
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', referral_code)
      .eq('is_active', true)
      .maybeSingle()

    if (codeError || !codeData) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    }

    // Prevent self-referral
    if (codeData.user_id === referred_user_id) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })
    }

    // SEC-006: Use database unique constraint to prevent race condition
    // Try to create referral - will fail if already exists due to unique constraint
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: codeData.user_id,
        referred_id: referred_user_id,
        referral_code: referral_code,
        status: 'pending',
        credit_amount: 200, // $2.00 in cents
        credit_type: 'dollars',
        referred_tier: 'free', // Will be updated when they subscribe
      })
      .select()
      .single()

    // Check for unique constraint violation
    if (referralError) {
      if (referralError.code === '23505') {
        // Unique violation - user already referred
        return NextResponse.json({ error: 'User already referred' }, { status: 400 })
      }
      logError(referralError, { context: 'create_referral' })
      return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 })
    }

    // Create pending earnings record
    const { error: earningsError } = await supabase.from('referral_earnings').insert({
      user_id: codeData.user_id,
      referral_id: referral.id,
      amount_cents: 200, // $2.00
      currency: 'usd',
      status: 'pending',
    })

    if (earningsError) {
      logError(earningsError, { context: 'create_earnings', referralId: referral.id })
    }

    // Increment uses count
    await supabase
      .from('referral_codes')
      .update({ uses_count: codeData.uses_count + 1 })
      .eq('id', codeData.id)

    return NextResponse.json({
      success: true,
      referral,
    })
  } catch (error: unknown) {
    logError(error, { context: 'track_referral' })
    return NextResponse.json(formatErrorResponse(error), { status: 500 })
  }
}

// SEC-001: Apply rate limiting
export const POST = createRateLimitedHandler('referral', handleTrackReferral)
