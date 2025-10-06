import { Metadata } from 'next'
import { PricingView } from './PricingView'

export const metadata: Metadata = {
  title: 'Pricing - Ottopen',
  description:
    'Choose the perfect plan for writers, publishers, producers, and industry professionals',
}

export default function PricingPage() {
  return <PricingView />
}
