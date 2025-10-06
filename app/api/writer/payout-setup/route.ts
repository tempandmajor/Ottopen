import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import {
  addExternalAccount,
  getAvailablePayoutMethods,
  validateBankAccount,
  getPayoutMethod,
} from '@/src/lib/stripe-payout-service'
import {
  getOrCreateConnectAccount,
  createConnectOnboardingLink,
} from '@/src/lib/stripe-connect-service'
import { logError } from '@/src/lib/errors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/writer/payout-setup
 * Get available payout methods for writer's country
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country') || 'US'

    const availableMethods = getAvailablePayoutMethods(country)
    const recommendedMethod = getPayoutMethod(country)

    return NextResponse.json({
      availableMethods,
      recommendedMethod,
      country,
    })
  } catch (error: any) {
    logError(error, { context: 'get_payout_methods' })
    return NextResponse.json(
      { error: error.message || 'Failed to get payout methods' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/writer/payout-setup
 * Setup payout method (Connect or Global Payout)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { method, country, ...bankDetails } = body

    // Get user email
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Method 1: Stripe Connect (for supported countries)
    if (method === 'connect') {
      const payoutMethod = getPayoutMethod(country)

      if (payoutMethod !== 'connect') {
        return NextResponse.json(
          {
            error: 'Stripe Connect not available in your country. Please use bank account payout.',
          },
          { status: 400 }
        )
      }

      // Create Connect account and onboarding link
      const accountId = await getOrCreateConnectAccount(user.id, userData.email)

      const onboardingUrl = await createConnectOnboardingLink(
        accountId,
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payout?status=success`,
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payout?status=refresh`
      )

      // Update user payout method
      await supabase
        .from('users')
        .update({
          payout_method: 'connect',
          payout_country: country,
        })
        .eq('id', user.id)

      return NextResponse.json({
        success: true,
        method: 'connect',
        onboardingUrl,
      })
    }

    // Method 2: Global Payouts (bank account)
    if (method === 'payout') {
      const {
        accountHolderName,
        accountHolderType,
        currency,
        routingNumber,
        accountNumber,
        iban,
        swiftBic,
      } = bankDetails

      // Validate bank details
      await validateBankAccount({
        country,
        currency,
        routingNumber,
        accountNumber,
        iban,
      })

      // Add external account
      const token = await addExternalAccount({
        userId: user.id,
        country,
        currency,
        accountHolderName,
        accountHolderType,
        routingNumber,
        accountNumber,
        iban,
        swiftBic,
      })

      return NextResponse.json({
        success: true,
        method: 'payout',
        tokenId: token.id,
        message: 'Bank account added successfully',
      })
    }

    return NextResponse.json(
      { error: 'Invalid payout method. Must be "connect" or "payout"' },
      { status: 400 }
    )
  } catch (error: any) {
    logError(error, { context: 'setup_payout_method' })
    return NextResponse.json(
      { error: error.message || 'Failed to setup payout method' },
      { status: 500 }
    )
  }
}
