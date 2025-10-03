'use client'

import { Navigation } from '@/src/components/navigation'
import { Footer } from '@/src/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { AlertTriangle, Shield, FileText, Users } from 'lucide-react'

export default function AgencyTerms() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold mb-4">
              Literary Agency Terms & Submission Guidelines
            </h1>
            <p className="text-muted-foreground text-lg">
              Important legal information for writers submitting manuscripts to Ottopen Literary
              Services
            </p>
          </div>

          {/* Critical Notice */}
          <Card className="mb-8 border-gray-300 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-gray-400">
                <AlertTriangle className="h-5 w-5" />
                <span>Important Notice</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-800 dark:text-gray-300">
              <p className="font-medium mb-2">
                By submitting material to Ottopen, you acknowledge and agree to these terms.
              </p>
              <p>
                We strongly recommend reading this entire document before submitting any creative
                work. Submission constitutes acceptance of all terms herein.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-8">
            {/* Intellectual Property Protection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Intellectual Property Protection</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Your Rights Are Protected</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>You retain all copyright and ownership of your submitted material</li>
                    <li>Ottopen will not share your work publicly or with unauthorized parties</li>
                    <li>
                      Access is limited to verified agents, publishers, and industry professionals
                    </li>
                    <li>All recipients are bound by confidentiality agreements</li>
                    <li>
                      We recommend registering copyrights before submission for additional
                      protection
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Industry Standard Disclaimer</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                    <strong>IMPORTANT:</strong> Ottopen Literary Services receives numerous
                    submissions and ideas. While we take reasonable precautions to protect submitted
                    materials, we cannot guarantee that ideas, themes, or concepts have not been
                    independently developed by others. By submitting material, you acknowledge that
                    similar works may exist or be developed independently.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submission Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Submission Guidelines</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">What to Submit (Industry Best Practices)</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Screenplays/TV Scripts:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Logline (1-2 sentences)</li>
                        <li>Synopsis (1-2 pages)</li>
                        <li>Treatment (optional)</li>
                        <li>Character descriptions</li>
                        <li>Writer bio</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Books/Novels:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Query letter</li>
                        <li>Synopsis (1-3 pages)</li>
                        <li>First 5-10 pages</li>
                        <li>Author platform information</li>
                        <li>Comparable titles</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-300 dark:border-gray-800">
                  <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-400">
                    Do NOT Submit:
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Complete manuscripts or full scripts initially</li>
                    <li>Material you do not own or control</li>
                    <li>Previously published or produced works without disclosure</li>
                    <li>Material currently under exclusive representation elsewhere</li>
                    <li>Incomplete works (unless specifically requested)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Agency Relationship */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Agency Relationship Terms</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Representation Agreement</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>
                      <strong>Commission Structure:</strong> 15% for primary representation
                    </li>
                    <li>
                      <strong>Co-Agent Relationships:</strong> 7.5% split when working with external
                      agents
                    </li>
                    <li>
                      <strong>Territory:</strong> Worldwide rights unless specifically limited
                    </li>
                    <li>
                      <strong>Duration:</strong> Typically 1-2 years with renewal options
                    </li>
                    <li>
                      <strong>Termination:</strong> 30-day written notice by either party
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Our Obligations as Your Agent</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Professional evaluation and feedback on submitted material</li>
                    <li>Strategic marketing to appropriate industry contacts</li>
                    <li>Negotiation of deals and contracts on your behalf</li>
                    <li>Regular communication about submission status and market feedback</li>
                    <li>Protection of your interests throughout the representation period</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Your Obligations as the Writer</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Provide accurate, complete, and truthful information about your work</li>
                    <li>Inform us of any previous submissions or existing agreements</li>
                    <li>Respond promptly to requests for revisions or additional material</li>
                    <li>Maintain professional communication standards</li>
                    <li>Honor exclusivity periods during active representation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Legal Disclaimers */}
            <Card>
              <CardHeader>
                <CardTitle>Legal Disclaimers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-4">
                  <p>
                    <strong>No Guarantee of Sale:</strong> While we will make professional efforts
                    to market your material, we cannot guarantee publication, production, or sale.
                    The entertainment and publishing industries are highly competitive.
                  </p>

                  <p>
                    <strong>Evaluation Process:</strong> Not all submitted material will be accepted
                    for representation. Our decision to represent is based on commercial viability,
                    market conditions, and agency capacity.
                  </p>

                  <p>
                    <strong>Response Time:</strong> We aim to respond to submissions within 4-6
                    weeks. No response after 8 weeks should be considered a pass.
                  </p>

                  <p>
                    <strong>Confidentiality:</strong> While we maintain confidentiality, the nature
                    of the business requires sharing material with potential buyers. All recipients
                    are professional industry contacts.
                  </p>

                  <p>
                    <strong>Governing Law:</strong> These terms are governed by the laws of [Your
                    State/Country]. Any disputes will be resolved through binding arbitration.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p>
                    <strong>Ottopen Literary Services</strong>
                  </p>
                  <p>Email: agents@ottopen.com</p>
                  <p>For questions about these terms: legal@ottopen.com</p>
                  <p>Last updated: {new Date().toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
