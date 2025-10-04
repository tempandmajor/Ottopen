import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Check if Stripe is configured
const isStripeConfigured = () => {
  return !!process.env.STRIPE_SECRET_KEY
}

const stripe = isStripeConfigured()
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    })
  : null

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is properly configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured. Please contact support.' },
        { status: 503 }
      )
    }

    const { customerId, userEmail, userName } = await request.json()

    let stripeCustomerId = customerId

    // If no customer ID provided, create a new customer
    if (!stripeCustomerId) {
      if (!userEmail) {
        return NextResponse.json(
          { error: 'User email is required to create customer' },
          { status: 400 }
        )
      }

      const customer = await stripe.customers.create({
        email: userEmail,
        name: userName || undefined,
      })

      stripeCustomerId = customer.id

      // TODO: Update user record with stripe_customer_id
      // This would require a database update call here
    }

    // Create a portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/settings?tab=subscription`,
    })

    return NextResponse.json({
      url: session.url,
      customerId: stripeCustomerId,
    })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
