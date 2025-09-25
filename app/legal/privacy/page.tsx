import { Navigation } from '@/src/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Separator } from '@/src/components/ui/separator'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft, Shield, Calendar, Lock, Eye, Database } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

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
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                  <Calendar className="h-4 w-4" />
                  <span>Last updated: January 15, 2024</span>
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
                    At Ottopen, we respect your privacy and are committed to protecting your
                    personal data. This Privacy Policy explains how we collect, use, store, and
                    protect your information when you use our literary social networking platform.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    This policy applies to all users of Ottopen, including writers, readers, and
                    literary professionals who create accounts and interact with our platform.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <Database className="h-6 w-6 mr-2" />
                    2. Information We Collect
                  </h2>

                  <h3 className="font-semibold text-lg mb-3">Information You Provide</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>
                      <strong>Account Information:</strong> Name, username, email address, password
                    </li>
                    <li>
                      <strong>Profile Information:</strong> Bio, location, website, writing
                      specialty, profile photo
                    </li>
                    <li>
                      <strong>Content:</strong> Posts, comments, messages, literary works, and other
                      content you share
                    </li>
                    <li>
                      <strong>Communication:</strong> Messages sent through our platform and support
                      requests
                    </li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">
                    Information We Collect Automatically
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>
                      <strong>Usage Data:</strong> How you interact with our platform, features
                      used, time spent
                    </li>
                    <li>
                      <strong>Device Information:</strong> Device type, operating system, browser
                      type and version
                    </li>
                    <li>
                      <strong>Log Data:</strong> IP address, access times, pages viewed, referring
                      websites
                    </li>
                    <li>
                      <strong>Cookies and Tracking:</strong> See our Cookie Policy for detailed
                      information
                    </li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <Eye className="h-6 w-6 mr-2" />
                    3. How We Use Your Information
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We use your information to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Provide and maintain our services</li>
                    <li>Enable you to connect with other writers and literary professionals</li>
                    <li>Personalize your experience and content recommendations</li>
                    <li>Send you notifications about activity on your account</li>
                    <li>Improve our platform and develop new features</li>
                    <li>Ensure platform security and prevent fraud</li>
                    <li>Comply with legal obligations</li>
                    <li>Send marketing communications (with your consent)</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">4. Information Sharing</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We do not sell your personal information. We may share your information in the
                    following circumstances:
                  </p>

                  <h3 className="font-semibold text-lg mb-3">Public Information</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Your profile information, posts, and other content you choose to make public
                    will be visible to other users and may be indexed by search engines.
                  </p>

                  <h3 className="font-semibold text-lg mb-3">Service Providers</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We work with trusted third-party service providers who help us operate our
                    platform, such as:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Cloud hosting and storage providers</li>
                    <li>Email service providers</li>
                    <li>Analytics and performance monitoring services</li>
                    <li>Customer support tools</li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">Legal Requirements</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We may disclose your information if required by law or to protect our rights,
                    property, or safety.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <Lock className="h-6 w-6 mr-2" />
                    5. Data Security
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We implement appropriate technical and organizational measures to protect your
                    personal information:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Access controls and authentication measures</li>
                    <li>Employee training on data protection practices</li>
                    <li>Incident response procedures</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    6. Your Rights and Choices
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You have the following rights regarding your personal information:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>
                      <strong>Access:</strong> Request a copy of your personal data
                    </li>
                    <li>
                      <strong>Correction:</strong> Update or correct inaccurate information
                    </li>
                    <li>
                      <strong>Deletion:</strong> Request deletion of your account and data
                    </li>
                    <li>
                      <strong>Portability:</strong> Export your data in a machine-readable format
                    </li>
                    <li>
                      <strong>Objection:</strong> Object to certain processing of your data
                    </li>
                    <li>
                      <strong>Restriction:</strong> Limit how we process your data
                    </li>
                  </ul>

                  <div className="bg-muted/50 p-4 rounded-lg mt-4">
                    <p className="font-medium">Managing Your Privacy Settings</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      You can manage your privacy preferences in your account settings, including:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 mt-2">
                      <li>Profile visibility settings</li>
                      <li>Notification preferences</li>
                      <li>Data sharing controls</li>
                      <li>Account deactivation or deletion</li>
                    </ul>
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">7. Data Retention</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We retain your personal information for as long as necessary to provide our
                    services and fulfill the purposes outlined in this policy. Specific retention
                    periods depend on the type of information:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>
                      <strong>Account Data:</strong> Until you delete your account
                    </li>
                    <li>
                      <strong>Content:</strong> Until you delete the specific content
                    </li>
                    <li>
                      <strong>Log Data:</strong> Typically 90 days
                    </li>
                    <li>
                      <strong>Support Data:</strong> 3 years after case closure
                    </li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    8. International Data Transfers
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Ottopen operates globally, and your information may be transferred to and
                    processed in countries other than your own. We ensure appropriate safeguards are
                    in place for international transfers, including standard contractual clauses and
                    adequacy decisions.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    9. Children&apos;s Privacy
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Ottopen is not intended for users under 13 years of age. We do not knowingly
                    collect personal information from children under 13. If we become aware that we
                    have collected such information, we will take steps to delete it promptly.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    10. Changes to This Policy
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We may update this Privacy Policy from time to time. We will notify you of any
                    material changes by posting the new policy on this page and updating the
                    &quot;Last updated&quot; date. We encourage you to review this policy
                    periodically.
                  </p>
                </section>

                <Separator className="my-6" />

                <section>
                  <h2 className="font-serif text-2xl font-semibold mb-4">11. Contact Us</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    If you have any questions about this Privacy Policy or our data practices,
                    please contact us:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="font-medium">Data Protection Officer</p>
                    <p className="text-muted-foreground">Email: privacy@ottopen.com</p>
                    <p className="text-muted-foreground">
                      Address: 123 Literary Lane, San Francisco, CA 94103
                    </p>
                    <p className="text-muted-foreground">Phone: +1 (555) 123-4567</p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/legal/terms">View Terms of Service</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
