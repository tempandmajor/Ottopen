'use client'

import { Footer } from '@/src/components/footer'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Check, Crown, Briefcase, Building, Film, BookOpen, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const writerPlans = [
  {
    name: 'Free',
    price: 0,
    priceId: null,
    tier: 'free',
    description: 'Perfect for getting started',
    features: [
      'Create and share scripts',
      'Join book clubs',
      'Basic editor features',
      'Community access',
      'Limited submissions (5/month)',
    ],
    limitations: ['No AI assistance', 'No advanced analytics', 'Standard support'],
    popular: false,
  },
  {
    name: 'Premium',
    price: 20,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM,
    tier: 'premium',
    description: 'Enhanced features for serious writers',
    features: [
      'Everything in Free',
      'AI writing assistance',
      'Advanced editor features',
      'Unlimited submissions',
      'Priority support',
      'Analytics dashboard',
      'Export to multiple formats',
    ],
    popular: true,
  },
  {
    name: 'Pro',
    price: 50,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    tier: 'pro',
    description: 'For professional writers',
    features: [
      'Everything in Premium',
      'Direct industry access',
      'Marketing tools',
      'Priority review queue',
      'Portfolio website',
      'Contract templates',
      'Collaboration tools',
      '1-on-1 mentorship sessions',
    ],
    popular: false,
  },
]

const industryPlans = [
  {
    name: 'External Agent',
    price: 200,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDUSTRY_BASIC,
    tier: 'industry_basic',
    description: 'For literary agents & scouts',
    icon: Briefcase,
    features: [
      'Manuscript access',
      'Writer discovery tools',
      'Co-agent relationships',
      'Industry networking',
      'Submission tracking',
      'Client management',
      'Contract tools',
    ],
  },
  {
    name: 'Publisher Access',
    price: 300,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PUBLISHER,
    tier: 'industry_premium',
    description: 'For book publishers & scouts',
    icon: BookOpen,
    features: [
      'Full manuscript library',
      'Advanced search & filters',
      'Acquisition tools',
      'Rights management',
      'Analytics & insights',
      'Publisher dashboard',
      'Priority access to new work',
    ],
  },
  {
    name: 'Producer Premium',
    price: 500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDUSTRY_PREMIUM,
    tier: 'industry_premium',
    description: 'For film/TV producers',
    icon: Film,
    features: [
      'First-look deals',
      'Script library access',
      'Development tools',
      'Option agreements',
      'Talent discovery',
      'Project management',
      'Industry partnerships',
      'IP tracking',
    ],
  },
]

export function PricingView() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string | null | undefined, tier: string) => {
    if (!priceId) {
      router.push('/auth/signup')
      return
    }

    setLoading(tier)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-blue-50 to-white py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Choose Your Perfect Plan
              </h1>
              <p className="text-xl text-gray-600">
                Unlock your creative potential with tools designed for writers and industry
                professionals
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Tables */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="writers" className="mx-auto max-w-7xl">
              <TabsList className="mx-auto mb-12 grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="writers">For Writers</TabsTrigger>
                <TabsTrigger value="industry">For Industry</TabsTrigger>
              </TabsList>

              {/* Writer Plans */}
              <TabsContent value="writers" className="mt-0">
                <div className="grid gap-8 md:grid-cols-3">
                  {writerPlans.map(plan => (
                    <Card
                      key={plan.tier}
                      className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
                          Most Popular
                        </Badge>
                      )}

                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {plan.name}
                          {plan.name === 'Pro' && <Crown className="h-5 w-5 text-yellow-500" />}
                        </CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="mt-4">
                          <span className="text-4xl font-bold">${plan.price}</span>
                          <span className="text-gray-600">/month</span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        <ul className="space-y-3">
                          {plan.features.map(feature => (
                            <li key={feature} className="flex items-start gap-2">
                              <Check className="h-5 w-5 shrink-0 text-green-500" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          onClick={() => handleSubscribe(plan.priceId, plan.tier)}
                          disabled={loading === plan.tier}
                          className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        >
                          {loading === plan.tier
                            ? 'Loading...'
                            : plan.price === 0
                              ? 'Get Started Free'
                              : 'Subscribe Now'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Industry Plans */}
              <TabsContent value="industry" className="mt-0">
                <div className="grid gap-8 md:grid-cols-3">
                  {industryPlans.map(plan => {
                    const Icon = plan.icon
                    return (
                      <Card key={plan.tier} className="border-2">
                        <CardHeader>
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                            <Icon className="h-6 w-6 text-blue-600" />
                          </div>
                          <CardTitle>{plan.name}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                          <div className="mt-4">
                            <span className="text-4xl font-bold">${plan.price}</span>
                            <span className="text-gray-600">/month</span>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                          <ul className="space-y-3">
                            {plan.features.map(feature => (
                              <li key={feature} className="flex items-start gap-2">
                                <Check className="h-5 w-5 shrink-0 text-green-500" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <Button
                            onClick={() => handleSubscribe(plan.priceId, plan.tier)}
                            disabled={loading === plan.tier}
                            className="w-full"
                            variant="default"
                          >
                            {loading === plan.tier ? 'Loading...' : 'Get Started'}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Job Marketplace CTA */}
        <section className="border-t bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <Card className="border-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Zap className="h-6 w-6" />
                        <h3 className="text-2xl font-bold">Job Marketplace</h3>
                      </div>
                      <p className="mb-4 text-blue-100">
                        Hire writers or find freelance work - completely free! We only charge a 10%
                        platform fee on completed jobs.
                      </p>
                      <ul className="mb-6 space-y-2 text-sm text-blue-50">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Secure escrow payments
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Milestone-based releases
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Global payments (Stripe Connect & Payouts)
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Rating & review system
                        </li>
                      </ul>
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => router.push('/opportunities')}
                      >
                        Browse Jobs
                      </Button>
                    </div>
                    <div className="hidden md:block">
                      <Briefcase className="h-32 w-32 opacity-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-center text-3xl font-bold">Frequently Asked Questions</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 font-semibold">How does the job marketplace work?</h3>
                  <p className="text-gray-600">
                    Post jobs for free or apply as a writer. Clients pay into escrow, and payments
                    are released when milestones are approved. We charge a 10% platform fee + Stripe
                    processing fees.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Can I get paid in my country?</h3>
                  <p className="text-gray-600">
                    Yes! We support Stripe Connect for 40+ countries and Stripe Global Payouts for
                    many more. Set up your preferred payout method in your dashboard.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Can I cancel my subscription anytime?</h3>
                  <p className="text-gray-600">
                    Yes, you can cancel your subscription at any time from your account settings.
                    Your access will continue until the end of your billing period.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
