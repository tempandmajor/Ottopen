import { getSupabaseAdmin } from './supabase-admin'
import { getStripe } from './stripe'

const PLATFORM_FEE_PERCENTAGE = 0.1 // 10%
const STRIPE_FEE_PERCENTAGE = 0.029 // 2.9%
const STRIPE_FEE_FIXED = 0.3 // $0.30

/**
 * Calculate platform and Stripe fees
 */
export function calculateFees(amount: number) {
  const platformFee = amount * PLATFORM_FEE_PERCENTAGE

  // Stripe fee calculation: (amount + 0.30) / (1 - 0.029)
  const stripeFee = amount * STRIPE_FEE_PERCENTAGE + STRIPE_FEE_FIXED

  const totalFees = platformFee + stripeFee
  const writerReceives = amount - totalFees

  return {
    totalAmount: amount,
    platformFee: Math.round(platformFee * 100) / 100,
    stripeFee: Math.round(stripeFee * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    writerReceives: Math.round(writerReceives * 100) / 100,
  }
}

/**
 * Get or create Stripe Connect account for writer
 */
export async function getOrCreateConnectAccount(userId: string, email: string) {
  const supabase = getSupabaseAdmin()
  const stripe = getStripe()

  // Check if user already has a Connect account
  const { data: user } = await supabase
    .from('users')
    .select('stripe_connect_account_id')
    .eq('id', userId)
    .single()

  if (user?.stripe_connect_account_id) {
    return user.stripe_connect_account_id
  }

  // Create new Connect account
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email,
    capabilities: {
      transfers: { requested: true },
    },
    business_type: 'individual',
    metadata: {
      user_id: userId,
      email,
    },
  })

  // Save to database
  await supabase.from('users').update({ stripe_connect_account_id: account.id }).eq('id', userId)

  return account.id
}

/**
 * Create onboarding link for writer to complete Stripe Connect setup
 */
export async function createConnectOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  const stripe = getStripe()

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })

  return accountLink.url
}

/**
 * Create payment intent with funds held in escrow
 */
export async function createEscrowPayment({
  amount,
  clientId,
  writerId,
  contractId,
  description,
}: {
  amount: number
  clientId: string
  writerId: string
  contractId: string
  description: string
}) {
  const stripe = getStripe()
  const supabase = getSupabaseAdmin()

  // Get client's Stripe customer ID
  const { data: client } = await supabase
    .from('users')
    .select('stripe_customer_id, email')
    .eq('id', clientId)
    .single()

  if (!client) {
    throw new Error('Client not found')
  }

  let customerId = client.stripe_customer_id

  // Create customer if doesn't exist
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: client.email,
      metadata: { user_id: clientId },
    })
    customerId = customer.id

    await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', clientId)
  }

  // Get writer's Connect account
  const { data: writer } = await supabase
    .from('users')
    .select('stripe_connect_account_id, email')
    .eq('id', writerId)
    .single()

  if (!writer?.stripe_connect_account_id) {
    throw new Error('Writer must complete Stripe Connect onboarding first')
  }

  // Calculate fees
  const fees = calculateFees(amount)

  // Create payment intent (funds held, not transferred yet)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    customer: customerId,
    payment_method_types: ['card'],
    description,
    metadata: {
      contract_id: contractId,
      client_id: clientId,
      writer_id: writerId,
      platform_fee: fees.platformFee.toString(),
      stripe_fee: fees.stripeFee.toString(),
    },
    // Important: Don't auto-confirm, we'll confirm when client completes payment
    capture_method: 'automatic',
  })

  return {
    paymentIntent,
    fees,
  }
}

/**
 * Release payment from escrow to writer (with platform fee)
 */
export async function releaseEscrowPayment({
  paymentIntentId,
  writerConnectAccountId,
  amount,
  platformFee,
  contractId,
  milestoneId,
}: {
  paymentIntentId: string
  writerConnectAccountId: string
  amount: number
  platformFee: number
  contractId: string
  milestoneId?: string
}) {
  const stripe = getStripe()
  const supabase = getSupabaseAdmin()

  // Calculate application fee (platform keeps this)
  const applicationFeeAmount = Math.round(platformFee * 100) // Convert to cents

  // Transfer to writer's Connect account (after deducting platform fee)
  const transfer = await stripe.transfers.create({
    amount: Math.round((amount - platformFee) * 100), // Amount writer receives in cents
    currency: 'usd',
    destination: writerConnectAccountId,
    transfer_group: contractId,
    metadata: {
      contract_id: contractId,
      milestone_id: milestoneId || '',
      platform_fee: platformFee.toString(),
    },
  })

  // Log transaction
  await supabase.from('payment_transactions').insert({
    contract_id: contractId,
    milestone_id: milestoneId,
    transaction_type: 'release',
    amount: amount - platformFee,
    stripe_payment_intent_id: paymentIntentId,
    stripe_transfer_id: transfer.id,
    description: `Payment released to writer`,
  })

  // Log platform fee
  await supabase.from('payment_transactions').insert({
    contract_id: contractId,
    milestone_id: milestoneId,
    transaction_type: 'fee',
    amount: platformFee,
    stripe_payment_intent_id: paymentIntentId,
    description: `Platform fee (10%)`,
  })

  return transfer
}

/**
 * Refund payment to client
 */
export async function refundPayment({
  paymentIntentId,
  amount,
  reason,
  contractId,
}: {
  paymentIntentId: string
  amount?: number
  reason?: string
  contractId: string
}) {
  const stripe = getStripe()
  const supabase = getSupabaseAdmin()

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
    reason: reason as any,
    metadata: {
      contract_id: contractId,
    },
  })

  // Log transaction
  await supabase.from('payment_transactions').insert({
    contract_id: contractId,
    transaction_type: 'refund',
    amount: (refund.amount || 0) / 100,
    stripe_payment_intent_id: paymentIntentId,
    stripe_charge_id: refund.charge as string,
    description: `Refund: ${reason || 'No reason provided'}`,
  })

  return refund
}

/**
 * Check if writer has completed Stripe Connect onboarding
 */
export async function checkConnectAccountStatus(accountId: string) {
  const stripe = getStripe()

  const account = await stripe.accounts.retrieve(accountId)

  return {
    onboarded: account.details_submitted || false,
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    requirements: account.requirements,
  }
}

/**
 * Create dashboard link for writer to view their Connect account
 */
export async function createConnectDashboardLink(accountId: string) {
  const stripe = getStripe()

  const loginLink = await stripe.accounts.createLoginLink(accountId)

  return loginLink.url
}
