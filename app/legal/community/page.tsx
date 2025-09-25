import { Navigation } from '@/src/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Separator } from '@/src/components/ui/separator'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  ArrowLeft,
  Users,
  Calendar,
  Heart,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Flag,
} from 'lucide-react'
import Link from 'next/link'

export default function CommunityGuidelines() {
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
              <Users className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold">Community Guidelines</h1>
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
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <Heart className="h-6 w-6 mr-2 text-red-500" />
                    1. Our Mission & Values
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Ottopen is a thriving community where writers, authors, screenwriters, and
                    literary enthusiasts come together to share their passion for storytelling. We
                    believe that creativity flourishes in an environment of mutual respect,
                    constructive feedback, and inclusive collaboration.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Our Core Values
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>
                        • <strong>Respect:</strong> Honor diverse voices and perspectives
                      </li>
                      <li>
                        • <strong>Creativity:</strong> Celebrate original thought and artistic
                        expression
                      </li>
                      <li>
                        • <strong>Growth:</strong> Support each other&apos;s creative development
                      </li>
                      <li>
                        • <strong>Authenticity:</strong> Be genuine in your interactions and work
                      </li>
                      <li>
                        • <strong>Inclusivity:</strong> Welcome writers from all backgrounds
                      </li>
                    </ul>
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <CheckCircle className="h-6 w-6 mr-2 text-green-500" />
                    2. What We Encourage
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We love to see our community members:
                  </p>

                  <div className="space-y-4">
                    <div className="border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        ✨ Creative Sharing
                      </h3>
                      <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                        <li>• Share original stories, poems, scripts, and excerpts</li>
                        <li>• Post work-in-progress updates and writing milestones</li>
                        <li>• Showcase your published works and achievements</li>
                        <li>• Share writing prompts and creative exercises</li>
                      </ul>
                    </div>

                    <div className="border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        🤝 Supportive Engagement
                      </h3>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Give constructive, specific feedback on others&apos; work</li>
                        <li>• Ask thoughtful questions about craft and technique</li>
                        <li>• Celebrate others&apos; successes and milestones</li>
                        <li>• Offer encouragement during creative challenges</li>
                      </ul>
                    </div>

                    <div className="border border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        📚 Knowledge Sharing
                      </h3>
                      <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                        <li>• Share writing tips, techniques, and resources</li>
                        <li>• Discuss literary works and their impact</li>
                        <li>• Provide industry insights and publishing guidance</li>
                        <li>• Mentor new writers and share your experience</li>
                      </ul>
                    </div>

                    <div className="border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 rounded-lg p-4">
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                        🌍 Community Building
                      </h3>
                      <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                        <li>• Participate in community challenges and events</li>
                        <li>• Connect with writers in your genre or region</li>
                        <li>• Form writing groups and collaboration partnerships</li>
                        <li>• Welcome new members and help them get started</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <XCircle className="h-6 w-6 mr-2 text-red-500" />
                    3. What&apos;s Not Allowed
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    To maintain a safe and productive environment, the following behaviors are
                    prohibited:
                  </p>

                  <div className="space-y-4">
                    <div className="border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 rounded-lg p-4">
                      <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Harassment & Hate Speech
                      </h3>
                      <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                        <li>• Personal attacks, bullying, or intimidation</li>
                        <li>
                          • Discriminatory language based on race, gender, religion, sexuality, or
                          other characteristics
                        </li>
                        <li>• Threats or violent language directed at individuals or groups</li>
                        <li>• Doxxing or sharing personal information without consent</li>
                      </ul>
                    </div>

                    <div className="border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 rounded-lg p-4">
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Inappropriate Content
                      </h3>
                      <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                        <li>
                          • Explicit sexual content or graphic violence (without appropriate
                          warnings)
                        </li>
                        <li>• Content that promotes illegal activities</li>
                        <li>• Spam, excessive self-promotion, or commercial solicitation</li>
                        <li>• Off-topic content unrelated to writing or literature</li>
                      </ul>
                    </div>

                    <div className="border border-gray-200 bg-gray-50 dark:bg-gray-950/20 dark:border-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        📝 Intellectual Property Violations
                      </h3>
                      <ul className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
                        <li>• Plagiarism or posting others&apos; work without permission</li>
                        <li>• Copyright infringement or unauthorized reproductions</li>
                        <li>• Impersonation of other authors or public figures</li>
                        <li>• False claims about your work or credentials</li>
                      </ul>
                    </div>

                    <div className="border border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        ⚙️ Platform Abuse
                      </h3>
                      <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                        <li>• Creating multiple accounts to circumvent restrictions</li>
                        <li>• Attempting to hack, exploit, or disrupt the platform</li>
                        <li>• Manipulating engagement metrics or gaming the system</li>
                        <li>• Sharing account credentials or accessing others&apos; accounts</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">4. Content Guidelines</h2>

                  <h3 className="font-semibold text-lg mb-3">Writing & Creative Content</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>All content must be your original work or properly attributed</li>
                    <li>Mature content should include appropriate content warnings</li>
                    <li>Excerpts and samples are encouraged; avoid posting complete works</li>
                    <li>Respect copyright when quoting or referencing other works</li>
                    <li>Use trigger warnings for sensitive topics (violence, trauma, etc.)</li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">Feedback & Critique</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Focus on the work, not the writer personally</li>
                    <li>Be specific and constructive in your feedback</li>
                    <li>Balance criticism with positive observations</li>
                    <li>Respect when someone asks for specific types of feedback</li>
                    <li>Don&apos;t provide unsolicited critique unless welcomed</li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">Profile & Bio Standards</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Use your real name or established pen name</li>
                    <li>Provide accurate information about your writing background</li>
                    <li>Professional profile photos are encouraged</li>
                    <li>Avoid using profile for commercial advertising</li>
                    <li>Include relevant writing credentials and achievements</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center">
                    <Flag className="h-6 w-6 mr-2" />
                    5. Reporting & Moderation
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    If you encounter content or behavior that violates these guidelines:
                  </p>

                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold mb-2">How to Report</h4>
                    <ol className="text-sm space-y-1">
                      <li>
                        1. Use the &quot;Report&quot; button on the specific content or profile
                      </li>
                      <li>2. Select the appropriate violation category</li>
                      <li>3. Provide additional context if needed</li>
                      <li>4. Our moderation team will review within 24 hours</li>
                    </ol>
                  </div>

                  <h3 className="font-semibold text-lg mb-3">Enforcement Actions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-literary-border rounded-lg">
                      <div>
                        <h4 className="font-medium">First Warning</h4>
                        <p className="text-sm text-muted-foreground">
                          Educational notice with guidance
                        </p>
                      </div>
                      <Badge variant="outline">Minor violations</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-literary-border rounded-lg">
                      <div>
                        <h4 className="font-medium">Content Removal</h4>
                        <p className="text-sm text-muted-foreground">Violating content removed</p>
                      </div>
                      <Badge variant="secondary">Moderate violations</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-literary-border rounded-lg">
                      <div>
                        <h4 className="font-medium">Temporary Suspension</h4>
                        <p className="text-sm text-muted-foreground">1-30 day account suspension</p>
                      </div>
                      <Badge variant="destructive">Serious violations</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-literary-border rounded-lg">
                      <div>
                        <h4 className="font-medium">Permanent Ban</h4>
                        <p className="text-sm text-muted-foreground">
                          Account permanently deactivated
                        </p>
                      </div>
                      <Badge variant="destructive">Severe/repeated violations</Badge>
                    </div>
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">6. Appeals Process</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    If you believe a moderation action was taken in error:
                  </p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Email appeals@ottopen.com within 30 days of the action</li>
                    <li>Include your username and details about the disputed action</li>
                    <li>Provide any relevant context or evidence</li>
                    <li>Our appeals team will review and respond within 7 business days</li>
                    <li>Appeals decisions are final</li>
                  </ol>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    7. Special Considerations
                  </h2>

                  <h3 className="font-semibold text-lg mb-3">Professional Authors & Publishers</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>You may share information about your published works</li>
                    <li>Book promotions should be community-focused, not pure advertising</li>
                    <li>Engage authentically with the community beyond self-promotion</li>
                    <li>Verify your identity through our author verification program</li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">Writing Contests & Challenges</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>External contests may be shared if they benefit the community</li>
                    <li>Avoid contests with excessive entry fees or suspicious terms</li>
                    <li>Community-run challenges are encouraged and supported</li>
                    <li>Prize contests must be transparent about rules and selection</li>
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">Beta Readers & Critique Partners</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Connecting for beta reading is encouraged</li>
                    <li>Establish clear expectations and timelines</li>
                    <li>Respect confidentiality agreements</li>
                    <li>Provide credit when appropriate</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h2 className="font-serif text-2xl font-semibold mb-4">
                    8. Updates to Guidelines
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    These Community Guidelines may be updated periodically to reflect:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Community feedback and evolving needs</li>
                    <li>New platform features and capabilities</li>
                    <li>Legal requirements and industry standards</li>
                    <li>Lessons learned from moderation experiences</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    We&apos;ll notify the community of significant changes through platform
                    announcements and email updates. Continued use of the platform indicates
                    acceptance of updated guidelines.
                  </p>
                </section>

                <Separator className="my-6" />

                <section>
                  <h2 className="font-serif text-2xl font-semibold mb-4">9. Questions & Contact</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Questions about these guidelines or need clarification?
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="font-medium">Community Team</p>
                    <p className="text-muted-foreground">
                      General Questions: community@ottopen.com
                    </p>
                    <p className="text-muted-foreground">Report Content: report@ottopen.com</p>
                    <p className="text-muted-foreground">Appeals: appeals@ottopen.com</p>
                    <p className="text-muted-foreground">Emergency: urgent@ottopen.com</p>
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
              <Link href="/legal/support">Support Policy</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
