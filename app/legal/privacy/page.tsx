import { Navigation } from '@/src/components/navigation'

import { Card, CardContent } from '@/src/components/ui/card'
import { Separator } from '@/src/components/ui/separator'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft, Lock, Calendar, Shield, Database, UserX } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPolicy() {
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
              <Lock className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
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
                  <h2 className="font-serif text-2xl font-semibold mb-4">1. Introduction</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Welcome to Ottopen (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are
                    committed to protecting your privacy and ensuring transparency about how we
                    collect, use, and safeguard your personal information. This Privacy Policy
                    explains our data practices for the Ottopen writing platform and all related
                    services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    By using Ottopen, you agree to the collection and use of information in
                    accordance with this policy. If you do not agree with our policies and
                    practices, please do not use our services.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <Database className="h-6 w-6 mr-2" />
                    2. Information We Collect
                  </h2>

                  <h3 className="font-semibold text-lg mb-3">Account Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Email address (required for account creation)</li>
                    <li>Username and display name</li>
                    <li>Password (encrypted and never stored in plain text)</li>
                    <li>Profile information (bio, avatar, writing preferences)</li>
                    <li>Subscription and payment information (processed by Stripe)</li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">Content & Usage Data</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Manuscripts, scripts, and other creative content you create</li>
                    <li>Comments, messages, and community interactions</li>
                    <li>Reading lists, bookmarks, and favorites</li>
                    <li>AI feature usage and prompts</li>
                    <li>Analytics data (page views, feature usage, engagement metrics)</li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">Technical Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>IP address and device information</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Cookies and similar tracking technologies</li>
                    <li>Session logs and authentication events</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <Shield className="h-6 w-6 mr-2" />
                    3. AI Services and Data Processing
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Ottopen uses advanced AI technology to provide writing assistance features. This
                    section explains how your data is processed when you use AI features.
                  </p>

                  <h3 className="font-semibold text-lg mb-3">Third-Party AI Providers</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    We partner with the following AI service providers to power our writing
                    assistance features:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <ul className="text-sm space-y-2">
                      <li>
                        <strong>Anthropic Claude:</strong> Character development, dialogue
                        enhancement, critique, and premium writing assistance
                      </li>
                      <li>
                        <strong>DeepSeek:</strong> Cost-effective AI for Pro tier users (general
                        writing assistance)
                      </li>
                      <li>
                        <strong>Google Gemini:</strong> Free tier AI assistance for basic writing
                        features
                      </li>
                      <li>
                        <strong>OpenAI GPT:</strong> General writing assistance and brainstorming
                        (fallback provider)
                      </li>
                      <li>
                        <strong>Perplexity AI:</strong> Research and fact-checking features
                        (optional)
                      </li>
                    </ul>
                  </div>

                  <h3 className="font-semibold text-lg mb-3">Data Sent to AI Providers</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    When you use AI features, the following data may be sent to third-party AI
                    providers:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>
                      Your manuscript/script content (contextual excerpts only, not entire
                      documents)
                    </li>
                    <li>User prompts and questions you submit to AI assistants</li>
                    <li>Genre, style, and format preferences relevant to your request</li>
                    <li>Selected text for rewriting, expansion, or critique</li>
                  </ul>

                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-4">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Important: What We DO NOT Share with AI Providers
                    </p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>✗ Personal identifying information (name, email, phone number)</li>
                      <li>✗ Payment information or billing details</li>
                      <li>✗ Account credentials or passwords</li>
                      <li>✗ Complete manuscripts or full documents (only relevant excerpts)</li>
                      <li>✗ Private messages or collaboration data</li>
                    </ul>
                  </div>

                  <h3 className="font-semibold text-lg mb-3">AI Provider Data Retention</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    Each AI provider has different data retention policies:
                  </p>
                  <div className="space-y-3 mb-4">
                    <div className="border border-literary-border rounded-lg p-3">
                      <h4 className="font-medium mb-1">Anthropic Claude</h4>
                      <p className="text-sm text-muted-foreground">
                        Does not train on user data. Zero retention for users who opt-out of data
                        sharing (default for Ottopen).
                      </p>
                    </div>
                    <div className="border border-literary-border rounded-lg p-3">
                      <h4 className="font-medium mb-1">OpenAI GPT</h4>
                      <p className="text-sm text-muted-foreground">
                        Does not train on API data. 30-day retention for abuse monitoring only.
                      </p>
                    </div>
                    <div className="border border-literary-border rounded-lg p-3">
                      <h4 className="font-medium mb-1">DeepSeek</h4>
                      <p className="text-sm text-muted-foreground">
                        Does not train on API data. Minimal retention for service operation.
                      </p>
                    </div>
                    <div className="border border-literary-border rounded-lg p-3">
                      <h4 className="font-medium mb-1">Google Gemini</h4>
                      <p className="text-sm text-muted-foreground">
                        May use data for service improvement. Users can opt-out via settings.
                      </p>
                    </div>
                    <div className="border border-literary-border rounded-lg p-3">
                      <h4 className="font-medium mb-1">Perplexity AI</h4>
                      <p className="text-sm text-muted-foreground">
                        Does not train on API data. Used for research queries only.
                      </p>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg mb-3">Your AI Data Rights</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">You can:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>
                      Opt-out of AI features entirely (Settings → AI Preferences → Disable AI)
                    </li>
                    <li>
                      Request deletion of AI processing logs (Settings → Privacy → Export/Delete
                      Data)
                    </li>
                    <li>Choose which AI provider to use (Studio tier only)</li>
                    <li>Disable AI features on a per-document basis</li>
                    <li>Review AI usage history and token consumption (Settings → AI Usage)</li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">AI Content Ownership</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>
                      You retain full ownership of all content you create, including AI-assisted
                      content
                    </li>
                    <li>
                      AI-generated suggestions become your property once accepted and edited by you
                    </li>
                    <li>We claim no ownership over your AI-assisted works</li>
                    <li>
                      You are responsible for ensuring AI-assisted content complies with copyright
                      law
                    </li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    4. How We Use Your Information
                  </h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Provide and maintain our writing platform services</li>
                    <li>Process your subscription and billing</li>
                    <li>Enable AI-powered writing assistance features</li>
                    <li>Facilitate collaboration and community features</li>
                    <li>Send important service updates and security notifications</li>
                    <li>Improve our services through analytics and user feedback</li>
                    <li>Prevent fraud, abuse, and security threats</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    5. Data Sharing & Disclosure
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We do not sell your personal information. We may share your information only in
                    the following circumstances:
                  </p>

                  <h3 className="font-semibold text-lg mb-3">Service Providers</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>
                      <strong>Supabase:</strong> Database hosting and authentication
                    </li>
                    <li>
                      <strong>Vercel:</strong> Application hosting and infrastructure
                    </li>
                    <li>
                      <strong>Stripe:</strong> Payment processing (they have their own privacy
                      policy)
                    </li>
                    <li>
                      <strong>AI Providers:</strong> As described in Section 3 above
                    </li>
                    <li>
                      <strong>Email Service:</strong> Transactional emails and notifications
                    </li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">Legal Requirements</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    We may disclose your information if required by law, such as:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>In response to valid legal requests (subpoenas, court orders)</li>
                    <li>To protect our rights, property, or safety</li>
                    <li>To prevent fraud or security threats</li>
                    <li>To comply with DMCA takedown notices</li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">Public Content</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Content you choose to share publicly (community posts, public profiles,
                    published works) is accessible to other users and may appear in search engines.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">6. Data Security</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We implement industry-standard security measures to protect your data:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>End-to-end encryption for data transmission (HTTPS/TLS)</li>
                    <li>Encrypted password storage (bcrypt hashing)</li>
                    <li>Row Level Security (RLS) for database access control</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Rate limiting and DDoS protection</li>
                    <li>Secure session management and CSRF protection</li>
                    <li>Comprehensive audit logging for security events</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    However, no method of transmission over the internet is 100% secure. While we
                    strive to protect your data, we cannot guarantee absolute security.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <UserX className="h-6 w-6 mr-2" />
                    7. Your Privacy Rights
                  </h2>

                  <h3 className="font-semibold text-lg mb-3">
                    GDPR Rights (for EU/EEA/UK residents)
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>
                      <strong>Right to Access:</strong> Request a copy of your personal data
                    </li>
                    <li>
                      <strong>Right to Rectification:</strong> Correct inaccurate or incomplete data
                    </li>
                    <li>
                      <strong>Right to Erasure:</strong> Request deletion of your data (&quot;right
                      to be forgotten&quot;)
                    </li>
                    <li>
                      <strong>Right to Data Portability:</strong> Receive your data in a
                      machine-readable format
                    </li>
                    <li>
                      <strong>Right to Restrict Processing:</strong> Limit how we use your data
                    </li>
                    <li>
                      <strong>Right to Object:</strong> Opt-out of certain data processing
                      activities
                    </li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">
                    CCPA Rights (for California residents)
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>
                      <strong>Right to Know:</strong> What personal information we collect and how
                      we use it
                    </li>
                    <li>
                      <strong>Right to Delete:</strong> Request deletion of your personal
                      information
                    </li>
                    <li>
                      <strong>Right to Opt-Out:</strong> Opt-out of the sale of personal information
                      (we do not sell data)
                    </li>
                    <li>
                      <strong>Right to Non-Discrimination:</strong> Equal service regardless of
                      privacy choices
                    </li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">How to Exercise Your Rights</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="font-medium mb-2">Self-Service Options:</p>
                    <ul className="text-sm space-y-1 mb-3">
                      <li>• Settings → Privacy → Export Data (download all your data)</li>
                      <li>• Settings → Privacy → Delete Account (permanent account deletion)</li>
                      <li>• Settings → AI Preferences (manage AI data usage)</li>
                      <li>• Settings → Privacy → Manage Cookies (cookie preferences)</li>
                    </ul>
                    <p className="font-medium mb-2">Contact Us:</p>
                    <p className="text-sm">
                      For assistance with privacy requests: privacy@ottopen.com
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      We will respond to verified requests within 30 days.
                    </p>
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">8. Data Retention</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>
                      <strong>Active Accounts:</strong> Data retained while your account is active
                    </li>
                    <li>
                      <strong>Deleted Accounts:</strong> Personal data deleted within 30 days
                      (anonymized analytics may be retained)
                    </li>
                    <li>
                      <strong>Legal Holds:</strong> Data may be retained longer if required by law
                      or legal proceedings
                    </li>
                    <li>
                      <strong>Backups:</strong> Deleted data may persist in backups for up to 90
                      days
                    </li>
                    <li>
                      <strong>AI Processing Logs:</strong> Deleted within 90 days unless you opt for
                      longer retention
                    </li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    9. Cookies & Tracking Technologies
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We use cookies and similar technologies to provide and improve our services:
                  </p>

                  <h3 className="font-semibold text-lg mb-3">Essential Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    Required for the platform to function (authentication, security, preferences).
                    Cannot be disabled.
                  </p>

                  <h3 className="font-semibold text-lg mb-3">Analytics Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    Help us understand how users interact with our platform (Google Analytics,
                    PostHog). Can be disabled in settings.
                  </p>

                  <h3 className="font-semibold text-lg mb-3">Performance Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    Improve platform performance and load times. Can be disabled in settings.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    10. Children&apos;s Privacy
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Ottopen is not intended for users under 13 years of age. We do not knowingly
                    collect personal information from children under 13. If we discover that we have
                    collected information from a child under 13, we will delete it immediately.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    If you believe we have inadvertently collected information from a child under
                    13, please contact us at privacy@ottopen.com.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    11. International Data Transfers
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Your data may be transferred to and processed in countries other than your
                    country of residence. We ensure adequate safeguards are in place through:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Standard Contractual Clauses (SCCs) with service providers</li>
                    <li>Compliance with GDPR and other privacy regulations</li>
                    <li>Data processing agreements with all third-party vendors</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    12. Changes to This Policy
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We may update this Privacy Policy periodically to reflect changes in our
                    practices, technology, legal requirements, or for other operational reasons. We
                    will notify you of significant changes via:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Email notification to your registered email address</li>
                    <li>Prominent notice on our platform</li>
                    <li>In-app notification</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    Continued use of Ottopen after changes indicates acceptance of the updated
                    policy.
                  </p>
                </section>

                <Separator className="my-6" />

                <section>
                  <h2 className="font-serif text-2xl font-semibold mb-4">13. Contact Us</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Questions, concerns, or requests regarding this Privacy Policy or our data
                    practices?
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="font-medium mb-2">Privacy Team</p>
                    <p className="text-muted-foreground">Email: privacy@ottopen.com</p>
                    <p className="text-muted-foreground">
                      Data Protection Officer: dpo@ottopen.com
                    </p>
                    <p className="text-muted-foreground">
                      GDPR Representative (EU): gdpr@ottopen.com
                    </p>
                    <p className="text-muted-foreground mt-3">
                      Response time: Within 30 days for privacy requests
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
              <Link href="/legal/community">Community Guidelines</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/legal/dmca">DMCA Policy</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
