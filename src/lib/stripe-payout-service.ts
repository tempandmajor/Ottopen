import Stripe from 'stripe'
import { getSupabaseAdmin } from './supabase-admin'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  })
}

/**
 * Countries where Stripe Connect is available
 * Writers in these countries will use Connect
 */
const STRIPE_CONNECT_COUNTRIES = [
  'US',
  'CA',
  'GB',
  'AU',
  'NZ',
  'IE',
  'AT',
  'BE',
  'DK',
  'FI',
  'FR',
  'DE',
  'IT',
  'LU',
  'NL',
  'NO',
  'PT',
  'ES',
  'SE',
  'CH',
  'SG',
  'HK',
  'JP',
  'MY',
  'AE',
  'BH',
  'BR',
  'CZ',
  'EE',
  'GR',
  'IN',
  'LT',
  'LV',
  'MX',
  'PL',
  'RO',
  'SA',
  'SK',
  'SI',
  'TH',
]

/**
 * Determine if a country supports Stripe Connect or needs Global Payouts
 */
export function getPayoutMethod(country: string): 'connect' | 'payout' {
  return STRIPE_CONNECT_COUNTRIES.includes(country.toUpperCase()) ? 'connect' : 'payout'
}

/**
 * Create or retrieve external account for Global Payouts
 * Writers provide bank details for direct payouts
 */
export async function addExternalAccount({
  userId,
  country,
  currency,
  accountHolderName,
  accountHolderType = 'individual',
  routingNumber,
  accountNumber,
  iban,
  swiftBic,
}: {
  userId: string
  country: string
  currency: string
  accountHolderName: string
  accountHolderType?: 'individual' | 'company'
  routingNumber?: string // For US banks
  accountNumber?: string // For US banks
  iban?: string // For European banks
  swiftBic?: string // For international transfers
}) {
  const stripe = getStripe()
  const supabase = getSupabaseAdmin()

  // For US banks
  let bankAccountData: any = {
    object: 'bank_account',
    country,
    currency: currency.toLowerCase(),
    account_holder_name: accountHolderName,
    account_holder_type: accountHolderType,
  }

  if (country === 'US' && routingNumber && accountNumber) {
    bankAccountData.routing_number = routingNumber
    bankAccountData.account_number = accountNumber
  } else if (iban) {
    // For SEPA/European banks
    bankAccountData = {
      object: 'bank_account',
      country,
      currency: currency.toLowerCase(),
      account_holder_name: accountHolderName,
      account_holder_type: accountHolderType,
      iban,
    }
  }

  // Create external account for payouts
  // Note: We'll store bank details in Stripe-tokenized form for security
  const token = await stripe.tokens.create({
    bank_account: bankAccountData,
  })

  // Save reference to user
  await supabase
    .from('users')
    .update({
      stripe_bank_account_token: token.id,
      payout_method: 'payout',
      payout_country: country,
      payout_currency: currency,
    })
    .eq('id', userId)

  return token
}

/**
 * Create payout to writer's bank account (Global Payouts)
 * Alternative to Connect transfers for unsupported countries
 */
export async function createGlobalPayout({
  userId,
  amount,
  currency = 'usd',
  description,
  contractId,
  milestoneId,
}: {
  userId: string
  amount: number
  currency?: string
  description: string
  contractId: string
  milestoneId?: string
}) {
  const stripe = getStripe()
  const supabase = getSupabaseAdmin()

  // Get user's bank account details
  const { data: user } = await supabase
    .from('users')
    .select('stripe_bank_account_token, payout_currency')
    .eq('id', userId)
    .single()

  if (!user?.stripe_bank_account_token) {
    throw new Error('Writer must add bank account details first')
  }

  // Create payout
  const payout = await stripe.payouts.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: user.payout_currency || currency,
    description,
    method: 'standard', // standard (2-3 days) or instant (for supported banks)
    metadata: {
      user_id: userId,
      contract_id: contractId,
      milestone_id: milestoneId || '',
    },
  })

  // Log transaction
  await supabase.from('payment_transactions').insert({
    contract_id: contractId,
    milestone_id: milestoneId,
    transaction_type: 'release',
    amount,
    stripe_transfer_id: payout.id,
    to_user_id: userId,
    description,
  })

  return payout
}

/**
 * Universal payment release - automatically chooses Connect or Global Payout
 */
export async function releasePaymentToWriter({
  writerId,
  amount,
  platformFee,
  contractId,
  milestoneId,
  paymentIntentId,
}: {
  writerId: string
  amount: number
  platformFee: number
  contractId: string
  milestoneId?: string
  paymentIntentId: string
}) {
  const supabase = getSupabaseAdmin()
  const stripe = getStripe()

  // Get writer's payout setup
  const { data: writer } = await supabase
    .from('users')
    .select('payout_method, stripe_connect_account_id, stripe_bank_account_token, payout_country')
    .eq('id', writerId)
    .single()

  if (!writer) {
    throw new Error('Writer not found')
  }

  const writerReceives = amount - platformFee

  // Use Stripe Connect if available
  if (writer.payout_method === 'connect' && writer.stripe_connect_account_id) {
    const { releaseEscrowPayment } = await import('./stripe-connect-service')
    return releaseEscrowPayment({
      paymentIntentId,
      writerConnectAccountId: writer.stripe_connect_account_id,
      amount,
      platformFee,
      contractId,
      milestoneId,
    })
  }

  // Otherwise use Global Payouts
  if (writer.payout_method === 'payout' && writer.stripe_bank_account_token) {
    return createGlobalPayout({
      userId: writerId,
      amount: writerReceives,
      description: `Payment for milestone`,
      contractId,
      milestoneId,
    })
  }

  throw new Error('Writer must complete payment setup (Connect or bank account)')
}

/**
 * Get available payout methods for a country
 */
export function getAvailablePayoutMethods(country: string) {
  const hasConnect = STRIPE_CONNECT_COUNTRIES.includes(country.toUpperCase())

  return {
    connect: hasConnect,
    globalPayout: true, // Available for most countries
    recommendedMethod: hasConnect ? 'connect' : 'globalPayout',
  }
}

/**
 * Validate bank account details before saving
 */
export async function validateBankAccount({
  country,
  currency,
  routingNumber,
  accountNumber,
  iban,
}: {
  country: string
  currency: string
  routingNumber?: string
  accountNumber?: string
  iban?: string
}) {
  // US validation
  if (country === 'US') {
    if (!routingNumber || !accountNumber) {
      throw new Error('US bank accounts require routing and account number')
    }
    if (routingNumber.length !== 9) {
      throw new Error('Routing number must be 9 digits')
    }
  }

  // SEPA/European validation
  if (['AT', 'BE', 'DE', 'ES', 'FR', 'GB', 'IE', 'IT', 'NL', 'PT'].includes(country)) {
    if (!iban) {
      throw new Error('European bank accounts require IBAN')
    }
  }

  return true
}
