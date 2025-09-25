'use client'

import { Navigation } from '@/src/components/navigation'
import { Footer } from '@/src/components/footer'
import { ProtectedRoute } from '@/src/components/auth/protected-route'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import {
  FileText,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  Plus,
  ExternalLink,
  Shield,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/src/contexts/auth-context'
import { toast } from 'react-hot-toast'

interface Manuscript {
  id: string
  title: string
  logline: string
  synopsis: string
  genre: string
  type: string
  pageCount: number
  status: string
  createdAt: string
}

interface Submission {
  id: string
  manuscriptTitle: string
  status: string
  submittedAt: string
  reviewerNotes?: string
}

export default function Submissions() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('my-submissions')
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  // New submission form state
  const [newSubmission, setNewSubmission] = useState({
    title: '',
    logline: '',
    synopsis: '',
    genre: '',
    type: '',
    pageCount: '',
    targetAudience: '',
    comparableWorks: '',
    authorBio: '',
    queryLetter: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)

  // Mock data for demo
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setManuscripts([
        {
          id: '1',
          title: 'The Last Chapter',
          logline:
            'A struggling writer discovers their fictional characters are real and living in a parallel dimension.',
          synopsis: 'When novelist Sarah Chen begins experiencing strange visions...',
          genre: 'Fantasy',
          type: 'book',
          pageCount: 320,
          status: 'submitted',
          createdAt: '2024-01-15',
        },
      ])

      setSubmissions([
        {
          id: '1',
          manuscriptTitle: 'The Last Chapter',
          status: 'under_review',
          submittedAt: '2024-01-15',
          reviewerNotes: 'Interesting premise. Awaiting full evaluation.',
        },
      ])

      setLoading(false)
    }, 1000)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasAcceptedTerms) {
      toast.error('Please accept the agency terms and conditions')
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast.success("Submission received! We'll review your material within 4-6 weeks.")

      // Reset form
      setNewSubmission({
        title: '',
        logline: '',
        synopsis: '',
        genre: '',
        type: '',
        pageCount: '',
        targetAudience: '',
        comparableWorks: '',
        authorBio: '',
        queryLetter: '',
      })
      setHasAcceptedTerms(false)

      // Switch to submissions tab
      setActiveTab('my-submissions')
    } catch (error) {
      toast.error('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'under_review':
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading submissions...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="font-serif text-3xl font-bold mb-2">Manuscript Submissions</h1>
              <p className="text-muted-foreground">
                Submit your work for professional literary representation
              </p>
            </div>

            {/* Important Notice */}
            <Card className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Your IP is Protected</p>
                    <p className="text-sm">
                      All submissions are confidential and only shared with verified industry
                      professionals. You retain all rights to your work. See our{' '}
                      <Button
                        variant="link"
                        className="h-auto p-0 text-blue-700 dark:text-blue-300 underline"
                        onClick={() => window.open('/legal/agency-terms', '_blank')}
                      >
                        Agency Terms
                      </Button>{' '}
                      for complete details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
                <TabsTrigger value="my-submissions" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">My Submissions</span>
                  <span className="sm:hidden">Submissions</span>
                </TabsTrigger>
                <TabsTrigger value="new-submission" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Submission</span>
                  <span className="sm:hidden">New</span>
                </TabsTrigger>
                <TabsTrigger value="guidelines" className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">Guidelines</span>
                </TabsTrigger>
              </TabsList>

              {/* My Submissions Tab */}
              <TabsContent value="my-submissions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {submissions.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Ready to share your work with industry professionals?
                        </p>
                        <Button onClick={() => setActiveTab('new-submission')}>
                          Create Your First Submission
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {submissions.map(submission => (
                          <div
                            key={submission.id}
                            className="border border-literary-border rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold mb-2">{submission.manuscriptTitle}</h3>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                                  <span>
                                    Submitted:{' '}
                                    {new Date(submission.submittedAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {submission.reviewerNotes && (
                                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                    <strong>Reader Notes:</strong> {submission.reviewerNotes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(submission.status)}
                                <Badge
                                  variant="outline"
                                  className={getStatusColor(submission.status)}
                                >
                                  {submission.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* New Submission Tab */}
              <TabsContent value="new-submission" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Submit New Manuscript</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Follow industry best practices - submit query materials first, not full
                      manuscripts.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            value={newSubmission.title}
                            onChange={e =>
                              setNewSubmission(prev => ({ ...prev, title: e.target.value }))
                            }
                            placeholder="Your manuscript title"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Type *</Label>
                          <Select
                            value={newSubmission.type}
                            onValueChange={value =>
                              setNewSubmission(prev => ({ ...prev, type: value }))
                            }
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select manuscript type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="screenplay">Feature Screenplay</SelectItem>
                              <SelectItem value="tv_pilot">TV Pilot</SelectItem>
                              <SelectItem value="stage_play">Stage Play</SelectItem>
                              <SelectItem value="book">Novel/Book</SelectItem>
                              <SelectItem value="short_story">Short Story</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="genre">Genre *</Label>
                          <Input
                            id="genre"
                            value={newSubmission.genre}
                            onChange={e =>
                              setNewSubmission(prev => ({ ...prev, genre: e.target.value }))
                            }
                            placeholder="e.g., Drama, Comedy, Thriller"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pageCount">Page Count *</Label>
                          <Input
                            id="pageCount"
                            type="number"
                            value={newSubmission.pageCount}
                            onChange={e =>
                              setNewSubmission(prev => ({ ...prev, pageCount: e.target.value }))
                            }
                            placeholder="Number of pages"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="logline">Logline *</Label>
                        <Textarea
                          id="logline"
                          value={newSubmission.logline}
                          onChange={e =>
                            setNewSubmission(prev => ({ ...prev, logline: e.target.value }))
                          }
                          placeholder="One to two sentence summary of your story"
                          className="min-h-[60px]"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          {newSubmission.logline.length}/200 characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="synopsis">Synopsis *</Label>
                        <Textarea
                          id="synopsis"
                          value={newSubmission.synopsis}
                          onChange={e =>
                            setNewSubmission(prev => ({ ...prev, synopsis: e.target.value }))
                          }
                          placeholder="1-2 page detailed summary including the ending"
                          className="min-h-[150px]"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          {newSubmission.synopsis.length}/2000 characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="queryLetter">Query Letter</Label>
                        <Textarea
                          id="queryLetter"
                          value={newSubmission.queryLetter}
                          onChange={e =>
                            setNewSubmission(prev => ({ ...prev, queryLetter: e.target.value }))
                          }
                          placeholder="Professional query letter (for books/novels)"
                          className="min-h-[120px]"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="targetAudience">Target Audience</Label>
                          <Input
                            id="targetAudience"
                            value={newSubmission.targetAudience}
                            onChange={e =>
                              setNewSubmission(prev => ({
                                ...prev,
                                targetAudience: e.target.value,
                              }))
                            }
                            placeholder="e.g., Young Adult, Adult Fiction"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comparableWorks">Comparable Works</Label>
                          <Input
                            id="comparableWorks"
                            value={newSubmission.comparableWorks}
                            onChange={e =>
                              setNewSubmission(prev => ({
                                ...prev,
                                comparableWorks: e.target.value,
                              }))
                            }
                            placeholder="Similar successful works"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="authorBio">Author Bio</Label>
                        <Textarea
                          id="authorBio"
                          value={newSubmission.authorBio}
                          onChange={e =>
                            setNewSubmission(prev => ({ ...prev, authorBio: e.target.value }))
                          }
                          placeholder="Your writing background and relevant experience"
                          className="min-h-[100px]"
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={hasAcceptedTerms}
                            onChange={e => setHasAcceptedTerms(e.target.checked)}
                            className="mt-1"
                          />
                          <label htmlFor="terms" className="text-sm text-muted-foreground">
                            I have read and agree to the{' '}
                            <Button
                              variant="link"
                              className="h-auto p-0 text-primary underline"
                              type="button"
                              onClick={() => window.open('/legal/agency-terms', '_blank')}
                            >
                              Literary Agency Terms & Submission Guidelines
                            </Button>
                            . I understand that Ottopen will act as my literary agent with a 15%
                            commission on any successful deals.
                          </label>
                        </div>

                        <Button
                          type="submit"
                          disabled={isSubmitting || !hasAcceptedTerms}
                          className="w-full"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Submit for Review
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Guidelines Tab */}
              <TabsContent value="guidelines" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Submission Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Industry Best Practices</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>
                          Submit query materials first - we&apos;ll request full manuscripts if
                          interested
                        </li>
                        <li>Include a compelling logline and detailed synopsis</li>
                        <li>Ensure your work is polished and professionally formatted</li>
                        <li>Research comparable works in your genre</li>
                        <li>Be patient - we receive hundreds of submissions monthly</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Response Timeline</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Initial review: 4-6 weeks</li>
                        <li>If we request additional material: 2-4 weeks</li>
                        <li>Representation decision: 1-2 weeks after full review</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">What Happens Next</h3>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Your submission is reviewed by our professional readers</li>
                        <li>Promising works are passed to our agents for evaluation</li>
                        <li>
                          If we decide to represent you, we&apos;ll send a representation agreement
                        </li>
                        <li>We begin marketing your work to industry professionals</li>
                        <li>We negotiate deals on your behalf with a 15% commission</li>
                      </ol>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => window.open('/legal/agency-terms', '_blank')}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Read Complete Agency Terms
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  )
}
