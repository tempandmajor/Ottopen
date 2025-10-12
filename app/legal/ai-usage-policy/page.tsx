import { Navigation } from '@/src/components/navigation'

import { Card, CardContent } from '@/src/components/ui/card'
import { Separator } from '@/src/components/ui/separator'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { ArrowLeft, Sparkles, Calendar, Zap, Shield, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function AIUsagePolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-3 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold">AI Usage Policy</h1>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                  <Calendar className="h-4 w-4" />
                  <span>Last updated: January 2025</span>
                </div>
              </div>
            </div>
          </div>

          <Card className="card-bg card-shadow border-literary-border">
            <CardContent className="p-6 sm:p-8">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">1. Overview</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Ottopen provides AI-powered writing assistance features to help you with
                    creative writing, editing, and brainstorming. This AI Usage Policy outlines the
                    limits, fair use guidelines, and terms for using our AI features across
                    different subscription tiers.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    By using Ottopen&apos;s AI features, you agree to comply with this policy and
                    our Terms of Service.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <Zap className="h-6 w-6 mr-2" />
                    2. Subscription Tier Limits
                  </h2>

                  <div className="space-y-4">
                    {/* Free Tier */}
                    <div className="border border-literary-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">Free Tier</h3>
                        <Badge variant="secondary">$0/month</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-start">
                          <span className="font-medium mr-2">AI Provider:</span>
                          <span>Google Gemini Flash</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Monthly Requests:</span>
                          <span>10 AI requests per month</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Tokens per Request:</span>
                          <span>500 tokens (~375 words)</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Features:</span>
                          <span>Basic brainstorming, simple rewrites, short expansions</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Cooldown:</span>
                          <span>24 hours between requests</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Memory Persistence:</span>
                          <span className="text-destructive">Not available</span>
                        </div>
                      </div>
                    </div>

                    {/* Pro Tier */}
                    <div className="border border-literary-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">Pro Tier</h3>
                        <Badge>$10/month</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-start">
                          <span className="font-medium mr-2">AI Provider:</span>
                          <span>DeepSeek V3 (93% cheaper than Claude)</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Monthly Requests:</span>
                          <span>100 AI requests per month</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Tokens per Request:</span>
                          <span>2,000 tokens (~1,500 words)</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Features:</span>
                          <span>
                            All AI features except memory persistence (expand, rewrite, describe,
                            brainstorm, critique, character development)
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Cooldown:</span>
                          <span>1 hour between requests</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Memory Persistence:</span>
                          <span className="text-destructive">Not available</span>
                        </div>
                      </div>
                    </div>

                    {/* Studio Tier */}
                    <div className="border-2 border-primary rounded-lg p-4 bg-primary/5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">Studio Tier</h3>
                        <Badge variant="default">$25/month</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-start">
                          <span className="font-medium mr-2">AI Provider:</span>
                          <span>Claude 4.5 Sonnet + all others (you choose)</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Monthly Requests:</span>
                          <span className="text-primary font-semibold">Unlimited</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Tokens per Request:</span>
                          <span>4,000 tokens (~3,000 words)</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Features:</span>
                          <span>
                            All AI features + memory persistence + multi-turn conversations + AI
                            writing room + table read
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Cooldown:</span>
                          <span className="text-primary font-semibold">None</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Memory Persistence:</span>
                          <span className="text-primary font-semibold">Available</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2">Priority:</span>
                          <span className="text-primary font-semibold">Faster response times</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <Shield className="h-6 w-6 mr-2" />
                    3. Fair Use Policy
                  </h2>

                  <h3 className="font-semibold text-lg mb-3">Acceptable Use</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    AI features are intended for the following purposes:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Writing assistance for your own creative works</li>
                    <li>Research and fact-checking for your manuscripts</li>
                    <li>Editing and improving your drafts</li>
                    <li>Learning and skill development</li>
                    <li>Brainstorming and ideation</li>
                    <li>Character development and dialogue enhancement</li>
                    <li>Story structure analysis</li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">Prohibited Use</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    The following uses of AI features are strictly prohibited:
                  </p>
                  <div className="space-y-3 mb-4">
                    <div className="border border-literary-border bg-muted/50 rounded-lg p-3">
                      <h4 className="font-medium mb-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                        Bulk Content Generation
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Using AI to generate content in bulk for spam, SEO farms, or content mills
                      </p>
                    </div>
                    <div className="border border-literary-border bg-muted/50 rounded-lg p-3">
                      <h4 className="font-medium mb-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                        Automated Posting
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Automated posting of AI-generated content to the community feed or forums
                      </p>
                    </div>
                    <div className="border border-literary-border bg-muted/50 rounded-lg p-3">
                      <h4 className="font-medium mb-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                        Reselling Access
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Reselling or redistributing access to Ottopen&apos;s AI features
                      </p>
                    </div>
                    <div className="border border-literary-border bg-muted/50 rounded-lg p-3">
                      <h4 className="font-medium mb-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                        Commercial AI Services
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Using Ottopen&apos;s API or AI features to power competing AI services
                      </p>
                    </div>
                    <div className="border border-literary-border bg-muted/50 rounded-lg p-3">
                      <h4 className="font-medium mb-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                        Training Competing Models
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Using our data or AI outputs to train competing AI models
                      </p>
                    </div>
                    <div className="border border-literary-border bg-muted/50 rounded-lg p-3">
                      <h4 className="font-medium mb-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                        Circumventing Rate Limits
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Creating multiple accounts to bypass rate limits or subscription tiers
                      </p>
                    </div>
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">4. Enforcement</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Violations of this AI Usage Policy may result in the following enforcement
                    actions:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start p-3 border border-literary-border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">First Offense</h4>
                        <p className="text-sm text-muted-foreground">
                          Written warning + 7-day AI feature suspension
                        </p>
                      </div>
                      <Badge variant="outline">Minor violations</Badge>
                    </div>
                    <div className="flex items-start p-3 border border-literary-border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">Second Offense</h4>
                        <p className="text-sm text-muted-foreground">
                          30-day AI feature suspension
                        </p>
                      </div>
                      <Badge variant="secondary">Moderate violations</Badge>
                    </div>
                    <div className="flex items-start p-3 border border-literary-border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">Third Offense</h4>
                        <p className="text-sm text-muted-foreground">
                          Permanent AI feature revocation (account remains active)
                        </p>
                      </div>
                      <Badge variant="destructive">Serious violations</Badge>
                    </div>
                    <div className="flex items-start p-3 border border-literary-border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">Severe Abuse</h4>
                        <p className="text-sm text-muted-foreground">
                          Account termination + potential legal action
                        </p>
                      </div>
                      <Badge variant="destructive">Severe/repeated violations</Badge>
                    </div>
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    5. Credits and Rollover
                  </h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>
                      <strong>Unused requests do NOT roll over</strong> to the next month (use it or
                      lose it)
                    </li>
                    <li>
                      <strong>Upgrades:</strong> Immediate access to higher tier limits upon upgrade
                    </li>
                    <li>
                      <strong>Downgrades:</strong> Tier changes take effect at the next billing
                      cycle
                    </li>
                    <li>
                      <strong>Request Counter Resets:</strong> Monthly on your billing date (e.g.,
                      if you signed up on the 15th, resets on the 15th of each month)
                    </li>
                    <li>
                      <strong>Studio Tier Unlimited:</strong> Fair use policy applies - excessive
                      abuse may trigger review
                    </li>
                  </ul>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Usage Dashboard</h4>
                    <p className="text-sm text-muted-foreground">
                      View your AI usage, remaining requests, and token consumption at:{' '}
                      <Link href="/settings/ai" className="text-primary hover:underline">
                        Settings → AI Usage
                      </Link>
                    </p>
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    6. AI Provider Transparency
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We believe in transparency about which AI providers power our features:
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="border border-literary-border rounded-lg p-3">
                      <h4 className="font-medium mb-1">Free Tier: Google Gemini Flash</h4>
                      <p className="text-sm text-muted-foreground">
                        Fast, cost-effective AI for basic writing assistance
                      </p>
                    </div>
                    <div className="border border-literary-border rounded-lg p-3">
                      <h4 className="font-medium mb-1">Pro Tier: DeepSeek V3</h4>
                      <p className="text-sm text-muted-foreground">
                        High-quality AI at 93% lower cost than Claude, enabling affordable access
                      </p>
                    </div>
                    <div className="border border-literary-border rounded-lg p-3">
                      <h4 className="font-medium mb-1">Studio Tier: Claude 4.5 Sonnet</h4>
                      <p className="text-sm text-muted-foreground">
                        Premium AI with advanced reasoning, memory persistence, and creative writing
                        capabilities
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    See our{' '}
                    <Link href="/legal/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>{' '}
                    for details on data processing by AI providers.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">7. Policy Updates</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We may update this AI Usage Policy to reflect:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Changes to AI provider pricing or capabilities</li>
                    <li>New AI features or models</li>
                    <li>User feedback and usage patterns</li>
                    <li>Legal or regulatory requirements</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    We will notify you of significant changes via email and in-app notifications.
                    Continued use of AI features after changes indicates acceptance of the updated
                    policy.
                  </p>
                </section>

                <Separator className="my-6" />

                <section>
                  <h2 className="font-serif text-2xl font-semibold mb-4">8. Questions & Support</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Questions about AI usage limits, billing, or features?
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="font-medium mb-2">AI Support Team</p>
                    <p className="text-muted-foreground">General Questions: support@ottopen.com</p>
                    <p className="text-muted-foreground">AI Billing: billing@ottopen.com</p>
                    <p className="text-muted-foreground">
                      Technical Issues: ai-support@ottopen.com
                    </p>
                    <p className="text-muted-foreground mt-3">
                      Response time: Within 24 hours for AI-related inquiries
                    </p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/legal/terms">Terms of Service</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/legal/privacy">Privacy Policy</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/legal/community">Community Guidelines</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
