import Stripe from 'stripe'

export function assertStripeEnv() {
  const missing: string[] = []
  if (!process.env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY')
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    missing.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
  if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET (for webhooks)')
  if (missing.length) {
    throw new Error(`Missing Stripe env vars: ${missing.join(', ')}`)
  }
}

// Canonical Stripe client singleton with correct API version
let stripeSingleton: Stripe | null = null
export function getStripe() {
  if (!stripeSingleton) {
    const key = process.env.STRIPE_SECRET_KEY as string
    stripeSingleton = new Stripe(key, {
      apiVersion: '2025-08-27.basil',
      appInfo: { name: 'Ottopen', version: '1.0.0' },
    })
  }
  return stripeSingleton
}

export const STRIPE_PRICE_BASIC = process.env.STRIPE_PRICE_BASIC
export const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO
export const APP_FEE_PERCENT = Number(process.env.STRIPE_APP_FEE_PERCENT || '10')

export function allowlistedPrice(priceId: string) {
  return [STRIPE_PRICE_BASIC, STRIPE_PRICE_PRO].filter(Boolean).includes(priceId)
}

export function calcApplicationFeeAmount(amountTotalCents: number) {
  // amount is in cents; round down for safety
  const pct = isFinite(APP_FEE_PERCENT) ? APP_FEE_PERCENT : 10
  return Math.floor((amountTotalCents * pct) / 100)
}
