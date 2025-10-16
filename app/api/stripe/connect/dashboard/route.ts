import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import Stripe from 'stripe'
import logger from '@/src/lib/logger'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  })
}

/**
 * POST /api/stripe/connect/dashboard
 * Create Stripe Express Dashboard login link
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

    // Get user's Stripe Connect account
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData || !userData.stripe_connect_account_id) {
      return NextResponse.json({ error: 'No Stripe Connect account found' }, { status: 404 })
    }

    // Create login link
    const stripe = getStripe()
    const loginLink = await stripe.accounts.createLoginLink(userData.stripe_connect_account_id)

    return NextResponse.json({
      success: true,
      url: loginLink.url,
    })
  } catch (error: any) {
    logger.error('Error creating dashboard link:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
