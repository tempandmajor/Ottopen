import { Navigation } from '@/src/components/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Separator } from '@/src/components/ui/separator'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function TermsOfService() {
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
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold">Terms of Service</h1>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                  <Calendar className="h-4 w-4" />
                  <span>Last updated: October 2, 2025</span>
                </div>
              </div>
            </div>
          </div>

          <Card className="card-bg card-shadow border-literary-border">
            <CardContent className="p-6 sm:p-8">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    By accessing and using Ottopen (&quot;the Service&quot;), you accept and agree
                    to be bound by the terms and provision of this agreement. If you do not agree to
                    abide by the above, please do not use this service.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    These Terms of Service govern your use of our literary social network platform,
                    including all content, services, and products available at or through the
                    service.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    2. Description of Service
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Ottopen is a comprehensive writing platform and social network designed for
                    writers, authors, screenwriters, playwrights, documentary filmmakers, and
                    literary enthusiasts. The service allows users to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>
                      Create and edit professional scripts, documentaries, stage plays, and
                      non-fiction books
                    </li>
                    <li>
                      Use AI-powered writing assistance features (dialogue enhancement, structure
                      analysis, fact-checking, etc.)
                    </li>
                    <li>Collaborate in real-time with other writers</li>
                    <li>
                      Export work to professional formats (PDF, Word, EPUB, Final Draft, Fountain)
                    </li>
                    <li>Convert content between different writing formats using AI</li>
                    <li>Create and maintain personal profiles</li>
                    <li>Share literary works, excerpts, and writing-related content</li>
                    <li>Connect with other writers and literary professionals</li>
                    <li>Participate in discussions about literature and writing</li>
                    <li>Discover new authors and works</li>
                    <li>Access shared research repository for cross-project notes</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    3. User Accounts and Registration
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    To access certain features of the Service, you must register for an account.
                    When you register, you agree to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain and promptly update your account information</li>
                    <li>Maintain the security of your password and account</li>
                    <li>Accept responsibility for all activities under your account</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    4. Content and Intellectual Property
                  </h2>
                  <h3 className="font-semibold text-lg mb-3">Your Content</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You retain ownership of any intellectual property rights in the content you post
                    to Ottopen. By posting content, you grant us a non-exclusive, royalty-free,
                    worldwide license to use, display, and distribute your content on the platform.
                  </p>

                  <h3 className="font-semibold text-lg mb-3">Prohibited Content</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You may not post content that:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Violates any applicable laws or regulations</li>
                    <li>Infringes on the rights of others</li>
                    <li>Contains harmful, threatening, or harassing material</li>
                    <li>Is spam, deceptive, or fraudulent</li>
                    <li>Contains viruses or malicious code</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">5. User Conduct</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Users are expected to maintain a respectful and professional environment.
                    Prohibited behaviors include:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Harassment, bullying, or intimidation of other users</li>
                    <li>Impersonating others or creating false identities</li>
                    <li>Attempting to gain unauthorized access to accounts or systems</li>
                    <li>Interfering with the proper functioning of the service</li>
                    <li>Collecting user information without consent</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">6. AI-Powered Features</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Ottopen provides AI-powered writing assistance features powered by advanced
                    language models. By using these features, you acknowledge and agree that:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>AI-generated content is provided as suggestions and assistance only</li>
                    <li>You are responsible for reviewing and editing all AI-generated content</li>
                    <li>AI suggestions may not always be accurate, appropriate, or original</li>
                    <li>You retain full ownership and responsibility for your final work</li>
                    <li>
                      Your content may be processed by third-party AI providers subject to their
                      terms
                    </li>
                    <li>
                      We do not guarantee the accuracy, completeness, or suitability of AI-generated
                      content
                    </li>
                    <li>Usage limits may apply based on your subscription tier</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">7. Privacy Policy</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Your privacy is important to us. Please review our Privacy Policy, which also
                    governs your use of the Service, to understand our practices regarding the
                    collection and use of your information.
                  </p>
                  <Link href="/legal/privacy" className="text-primary hover:underline">
                    View Privacy Policy →
                  </Link>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">8. Termination</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We may terminate or suspend your account and access to the Service immediately,
                    without prior notice, for any reason, including breach of these Terms. You may
                    also terminate your account at any time through your account settings.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">9. Disclaimer</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    The Service is provided &quot;as is&quot; without any representations or
                    warranties. We do not warrant that the Service will be uninterrupted, secure, or
                    error-free. Your use of the Service is at your own risk.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    10. Limitation of Liability
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    To the maximum extent permitted by law, Ottopen shall not be liable for any
                    indirect, incidental, special, consequential, or punitive damages arising out of
                    your use of the Service.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">11. Changes to Terms</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We reserve the right to modify these Terms at any time. We will notify users of
                    any material changes via email or through the Service. Your continued use of the
                    Service after such modifications constitutes acceptance of the updated Terms.
                  </p>
                </section>

                <Separator className="my-6" />

                <section>
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    12. Contact Information
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    If you have any questions about these Terms of Service, please contact us at:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="font-medium">Ottopen Legal Team</p>
                    <p className="text-muted-foreground">Email: legal@ottopen.app</p>
                    <p className="text-muted-foreground">
                      Address: 123 Literary Lane, San Francisco, CA 94103
                    </p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/legal/privacy">View Privacy Policy</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
