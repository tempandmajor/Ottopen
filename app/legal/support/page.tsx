import { Navigation } from '@/src/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Separator } from '@/src/components/ui/separator'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  ArrowLeft,
  HelpCircle,
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'

export default function SupportPolicy() {
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
              <HelpCircle className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold">Support Policy</h1>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                  <Calendar className="h-4 w-4" />
                  <span>Last updated: September 23, 2024</span>
                </div>
              </div>
            </div>
          </div>

          <Card className="card-bg card-shadow border-literary-border">
            <CardContent className="p-6 sm:p-8">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    1. Our Commitment to Support
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    At Ottopen, we are committed to providing excellent support to our community of
                    writers, authors, and literary enthusiasts. This Support Policy outlines our
                    approach to customer service, response times, and the types of assistance we
                    provide.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We believe that responsive, helpful support is essential to maintaining a
                    thriving literary community where creators can focus on their craft.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <MessageSquare className="h-6 w-6 mr-2" />
                    2. Support Channels
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We offer multiple ways to get help when you need it:
                  </p>

                  <div className="grid gap-4 mb-6">
                    <div className="border border-literary-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          Email Support
                        </h3>
                        <Badge variant="default">Primary</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        For account issues, technical problems, and general inquiries
                      </p>
                      <p className="text-sm font-medium">support@ottopen.com</p>
                    </div>

                    <div className="border border-literary-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold flex items-center">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          Help Center
                        </h3>
                        <Badge variant="secondary">Self-Service</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Browse our comprehensive knowledge base and FAQ
                      </p>
                      <p className="text-sm font-medium">help.ottopen.com</p>
                    </div>

                    <div className="border border-literary-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Community Forums
                        </h3>
                        <Badge variant="outline">Community</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Get help from other users and share knowledge
                      </p>
                      <p className="text-sm font-medium">Available in-app</p>
                    </div>
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <Clock className="h-6 w-6 mr-2" />
                    3. Response Times
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We strive to respond to all support requests as quickly as possible. Our target
                    response times are:
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-literary-border rounded-lg">
                      <div>
                        <h4 className="font-semibold flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 text-gray-600" />
                          Critical Issues
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Account access, security breaches, data loss
                        </p>
                      </div>
                      <Badge variant="destructive">4 hours</Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-literary-border rounded-lg">
                      <div>
                        <h4 className="font-semibold flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 text-gray-600" />
                          High Priority
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Platform bugs, payment issues, content problems
                        </p>
                      </div>
                      <Badge variant="secondary">24 hours</Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-literary-border rounded-lg">
                      <div>
                        <h4 className="font-semibold flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-gray-600" />
                          General Inquiries
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Feature questions, general help, feedback
                        </p>
                      </div>
                      <Badge variant="outline">48 hours</Badge>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg mt-4">
                    <p className="text-sm font-medium">Business Hours</p>
                    <p className="text-sm text-muted-foreground">
                      Monday - Friday, 9 AM - 6 PM PST. Critical issues are monitored 24/7.
                    </p>
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    4. Types of Support We Provide
                  </h2>

                  <h3 className="font-semibold text-lg mb-3">Technical Support</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Account setup and configuration assistance</li>
                    <li>Platform feature guidance and tutorials</li>
                    <li>Troubleshooting technical issues</li>
                    <li>Browser compatibility and mobile app support</li>
                    <li>File upload and formatting assistance</li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">Account Support</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Password reset and account recovery</li>
                    <li>Profile setup and customization help</li>
                    <li>Privacy settings configuration</li>
                    <li>Account deactivation or deletion requests</li>
                    <li>Data export and portability assistance</li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">Content Support</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Content policy clarification</li>
                    <li>Copyright and intellectual property guidance</li>
                    <li>Content moderation appeals</li>
                    <li>Publishing and sharing best practices</li>
                    <li>Community guidelines interpretation</li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">Community Support</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Reporting inappropriate behavior or content</li>
                    <li>Resolving conflicts between users</li>
                    <li>Feature requests and feedback collection</li>
                    <li>Community event support</li>
                    <li>Mentorship program assistance</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    5. What We Don&apos;t Support
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    While we strive to be helpful, there are some limitations to our support:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Writing critique or editorial services</li>
                    <li>Legal advice regarding publishing or contracts</li>
                    <li>Personal writing coaching or mentoring</li>
                    <li>Third-party service integrations not officially supported</li>
                    <li>Custom feature development for individual users</li>
                    <li>Recovery of content deleted more than 30 days ago</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    6. Getting Better Support
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    To help us assist you more effectively, please:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Provide a clear description of the issue or question</li>
                    <li>Include relevant account information (username, email)</li>
                    <li>Describe the steps you&apos;ve already tried</li>
                    <li>Include screenshots or error messages when applicable</li>
                    <li>Specify your device, browser, and operating system</li>
                    <li>Be patient and respectful in all communications</li>
                  </ul>

                  <div className="bg-gray-50 dark:bg-gray-950/20 border border-gray-300 dark:border-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Pro Tip</h4>
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      Check our Help Center first - many common questions are answered there, and
                      you&apos;ll get an instant solution!
                    </p>
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">7. Escalation Process</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    If you&apos;re not satisfied with the initial support response:
                  </p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Reply to the support ticket with additional details</li>
                    <li>Request escalation to a senior support specialist</li>
                    <li>
                      For urgent matters, contact our escalation email: escalation@ottopen.com
                    </li>
                    <li>As a last resort, contact our support management team</li>
                  </ol>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    8. Support for Premium Users
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Premium subscribers receive enhanced support benefits:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Priority response times (50% faster)</li>
                    <li>Direct access to senior support specialists</li>
                    <li>Phone support for critical issues</li>
                    <li>Account management assistance</li>
                    <li>Beta feature support and early access</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    9. Feedback and Improvement
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We continuously work to improve our support services. After each interaction,
                    you&apos;ll have the opportunity to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Rate your support experience</li>
                    <li>Provide feedback on our response quality</li>
                    <li>Suggest improvements to our help resources</li>
                    <li>Report any issues with support team members</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section>
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    10. Contact Information
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Need help? Here&apos;s how to reach us:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="font-medium">Ottopen Support Team</p>
                    <p className="text-muted-foreground">General Support: support@ottopen.com</p>
                    <p className="text-muted-foreground">Escalations: escalation@ottopen.com</p>
                    <p className="text-muted-foreground">Premium Support: premium@ottopen.com</p>
                    <p className="text-muted-foreground">Help Center: help.ottopen.com</p>
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
