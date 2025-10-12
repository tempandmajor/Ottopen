'use client'
import { Navigation } from '@/src/components/navigation'

import { Footer } from '@/src/components/footer'
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
  Plus,
  ExternalLink,
  Shield,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Manuscript, Submission, User as SupabaseUser } from '@/src/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'
import {
  createManuscriptAction,
  createSubmissionAction,
  withdrawSubmissionAction,
} from '@/app/actions/submissions'
import { DatabaseService } from '@/src/lib/database'

interface SubmissionsViewProps {
  user: (User & { profile?: SupabaseUser }) | null
  manuscripts: Manuscript[]
  submissions: Submission[]
}

interface SubmissionWithManuscript extends Submission {
  manuscript?: Manuscript
}

interface FormErrors {
  title?: string
  type?: string
  genre?: string
  pageCount?: string
  logline?: string
  synopsis?: string
}

export function SubmissionsView({
  user,
  manuscripts: initialManuscripts,
  submissions: initialSubmissions,
}: SubmissionsViewProps) {
  const userId = user?.profile?.id || user?.id

  const [activeTab, setActiveTab] = useState('my-submissions')
  const [manuscripts, setManuscripts] = useState<Manuscript[]>(initialManuscripts)
  const [submissions, setSubmissions] = useState<SubmissionWithManuscript[]>(
    initialSubmissions as SubmissionWithManuscript[]
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status'>('newest')
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [showOptionalFields, setShowOptionalFields] = useState(false)

  // Form state - consolidated into single object
  const [formData, setFormData] = useState({
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

  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)

  // Auto-save to localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('submission-draft')
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        setFormData(draft)
      } catch (error) {
        // Invalid draft, ignore
      }
    }
  }, [])

  useEffect(() => {
    const hasContent = Object.values(formData).some(value => value.length > 0)
    if (hasContent) {
      localStorage.setItem('submission-draft', JSON.stringify(formData))
    }
  }, [formData])

  // Real-time subscription for submission status updates
  useEffect(() => {
    if (!userId) return

    const dbService = new DatabaseService()
    const supabase = dbService.getSupabaseClient()
    if (!supabase) {
      console.warn('Supabase client not available for real-time updates')
      return
    }

    const channel = supabase
      .channel(`submissions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `submitter_id=eq.${userId}`,
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            const newSubmission = payload.new as SubmissionWithManuscript
            setSubmissions(prev => [newSubmission, ...prev])
            toast.success('New submission created!')
          } else if (payload.eventType === 'UPDATE') {
            const updatedSubmission = payload.new as SubmissionWithManuscript
            setSubmissions(prev =>
              prev.map(s => (s.id === updatedSubmission.id ? updatedSubmission : s))
            )
            // Show toast for status changes
            if (payload.old.status !== payload.new.status) {
              toast.success(`Submission status updated to: ${payload.new.status.replace('_', ' ')}`)
            }
          } else if (payload.eventType === 'DELETE') {
            setSubmissions(prev => prev.filter(s => s.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId])

  const updateField = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    setFormErrors(prev => ({ ...prev, [field]: undefined }))
  }, [])

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.type) errors.type = 'Type is required'
    if (!formData.genre.trim()) errors.genre = 'Genre is required'
    if (!formData.pageCount || parseInt(formData.pageCount) <= 0)
      errors.pageCount = 'Valid page count is required'
    if (!formData.logline.trim()) errors.logline = 'Logline is required'
    if (formData.logline.length > 200) errors.logline = 'Logline must be 200 characters or less'
    if (!formData.synopsis.trim()) errors.synopsis = 'Synopsis is required'
    if (formData.synopsis.length > 2000)
      errors.synopsis = 'Synopsis must be 2000 characters or less'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasAcceptedTerms) {
      toast.error('Please accept the agency terms and conditions')
      return
    }

    if (!userId) {
      toast.error('Please log in to submit your manuscript')
      return
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsSubmitting(true)

    try {
      // Create manuscript
      const manuscriptResult = await createManuscriptAction({
        user_id: userId,
        title: formData.title,
        logline: formData.logline,
        synopsis: formData.synopsis,
        genre: formData.genre,
        type: formData.type as 'screenplay' | 'tv_pilot' | 'stage_play' | 'book' | 'short_story',
        page_count: parseInt(formData.pageCount),
        status: 'draft',
        is_complete: true,
        query_letter: formData.queryLetter || undefined,
        target_audience: formData.targetAudience || undefined,
        comparable_works: formData.comparableWorks || undefined,
        author_bio: formData.authorBio || undefined,
      })

      if (!manuscriptResult.success || !manuscriptResult.data) {
        throw new Error(manuscriptResult.error || 'Failed to create manuscript')
      }

      // Create submission
      const submissionResult = await createSubmissionAction({
        manuscript_id: manuscriptResult.data.id,
        submitter_id: userId,
        reviewer_id: undefined,
        status: 'pending',
        submission_type: 'query',
        reader_notes: undefined,
        agent_notes: undefined,
        feedback: undefined,
        score: undefined,
        reviewed_at: undefined,
      })

      if (!submissionResult.success || !submissionResult.data) {
        throw new Error(submissionResult.error || 'Failed to create submission')
      }

      toast.success("Submission received! We'll review your material within 4-6 weeks.")

      // Update state without page reload
      setManuscripts(prev => [manuscriptResult.data!, ...prev])
      setSubmissions(prev => [
        {
          ...submissionResult.data!,
          manuscript: manuscriptResult.data,
        } as SubmissionWithManuscript,
        ...prev,
      ])

      // Reset form
      setFormData({
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
      setFormErrors({})
      setShowOptionalFields(false)

      // Clear draft
      localStorage.removeItem('submission-draft')

      // Switch to submissions tab
      setActiveTab('my-submissions')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWithdraw = async (submissionId: string) => {
    if (!confirm('Are you sure you want to withdraw this submission?')) return

    try {
      const result = await withdrawSubmissionAction(submissionId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to withdraw submission')
      }
      toast.success('Submission withdrawn')
      // State will update via real-time subscription
    } catch (error) {
      toast.error('Failed to withdraw submission')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-600" />
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
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
      case 'under_review':
        return 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      case 'accepted':
        return 'bg-green-50 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'rejected':
        return 'bg-red-50 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
    }
  }

  // Filtered and sorted submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        s =>
          s.manuscript?.title?.toLowerCase().includes(query) ||
          s.manuscript?.genre?.toLowerCase().includes(query) ||
          s.manuscript?.type?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter)
    }

    // Sort
    const sorted = [...filtered]
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else if (sortBy === 'status') {
      sorted.sort((a, b) => a.status.localeCompare(b.status))
    }

    return sorted
  }, [submissions, searchQuery, statusFilter, sortBy])

  return (
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
          <Card className="mb-8 border-gray-300 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-gray-700 mt-0.5" />
                <div className="text-gray-800 dark:text-gray-300">
                  <p className="font-medium mb-1">Your IP is Protected</p>
                  <p className="text-sm">
                    All submissions are confidential and only shared with verified industry
                    professionals. You retain all rights to your work. See our{' '}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-gray-800 dark:text-gray-300 underline"
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle>Current Submissions</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search submissions..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="pl-8 w-full sm:w-[200px]"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sortBy} onValueChange={value => setSortBy(value as any)}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="status">By Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredSubmissions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">
                        {submissions.length === 0
                          ? 'No submissions yet'
                          : 'No matching submissions'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {submissions.length === 0
                          ? 'Ready to share your work with industry professionals?'
                          : 'Try adjusting your search or filters'}
                      </p>
                      {submissions.length === 0 && (
                        <Button onClick={() => setActiveTab('new-submission')}>
                          Create Your First Submission
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredSubmissions.map(submission => (
                        <div
                          key={submission.id}
                          className="border border-literary-border rounded-lg p-4 hover:border-gray-400 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold">
                                  {submission.manuscript?.title || 'Unknown Title'}
                                </h3>
                                <div className="flex items-center space-x-2 ml-4">
                                  {getStatusIcon(submission.status)}
                                  <Badge
                                    variant="outline"
                                    className={getStatusColor(submission.status)}
                                  >
                                    {submission.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                                <span>
                                  Submitted: {new Date(submission.created_at).toLocaleDateString()}
                                </span>
                                <span>Type: {submission.manuscript?.type || 'Unknown'}</span>
                                <span>Genre: {submission.manuscript?.genre || 'Unknown'}</span>
                              </div>
                              {selectedSubmission === submission.id && (
                                <div className="mt-4 space-y-3">
                                  {submission.manuscript?.logline && (
                                    <div className="text-sm">
                                      <strong>Logline:</strong> {submission.manuscript.logline}
                                    </div>
                                  )}
                                  {submission.reader_notes && (
                                    <div className="text-sm bg-muted p-3 rounded">
                                      <strong>Reader Notes:</strong> {submission.reader_notes}
                                    </div>
                                  )}
                                  {submission.agent_notes && (
                                    <div className="text-sm bg-muted p-3 rounded">
                                      <strong>Agent Notes:</strong> {submission.agent_notes}
                                    </div>
                                  )}
                                  {submission.feedback && (
                                    <div className="text-sm bg-muted p-3 rounded">
                                      <strong>Feedback:</strong> {submission.feedback}
                                    </div>
                                  )}
                                  {submission.score && (
                                    <div className="text-sm">
                                      <strong>Score:</strong> {submission.score}/10
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setSelectedSubmission(
                                      selectedSubmission === submission.id ? null : submission.id
                                    )
                                  }
                                >
                                  {selectedSubmission === submission.id ? (
                                    <>
                                      <ChevronUp className="h-4 w-4 mr-1" />
                                      Hide Details
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                      View Details
                                    </>
                                  )}
                                </Button>
                                {submission.status === 'pending' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleWithdraw(submission.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Withdraw
                                  </Button>
                                )}
                              </div>
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
                    {/* Essential Fields */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Essential Information
                      </h3>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={e => updateField('title', e.target.value)}
                            placeholder="Your manuscript title"
                            required
                            className={formErrors.title ? 'border-red-500' : ''}
                          />
                          {formErrors.title && (
                            <p className="text-xs text-red-600">{formErrors.title}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Type *</Label>
                          <Select
                            value={formData.type}
                            onValueChange={value => updateField('type', value)}
                            required
                          >
                            <SelectTrigger className={formErrors.type ? 'border-red-500' : ''}>
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
                          {formErrors.type && (
                            <p className="text-xs text-red-600">{formErrors.type}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="genre">Genre *</Label>
                          <Input
                            id="genre"
                            value={formData.genre}
                            onChange={e => updateField('genre', e.target.value)}
                            placeholder="e.g., Drama, Comedy, Thriller"
                            required
                            className={formErrors.genre ? 'border-red-500' : ''}
                          />
                          {formErrors.genre && (
                            <p className="text-xs text-red-600">{formErrors.genre}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pageCount">Page Count *</Label>
                          <Input
                            id="pageCount"
                            type="number"
                            min="1"
                            value={formData.pageCount}
                            onChange={e => updateField('pageCount', e.target.value)}
                            placeholder="Number of pages"
                            required
                            className={formErrors.pageCount ? 'border-red-500' : ''}
                          />
                          {formErrors.pageCount && (
                            <p className="text-xs text-red-600">{formErrors.pageCount}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="logline">Logline *</Label>
                        <Textarea
                          id="logline"
                          value={formData.logline}
                          onChange={e => updateField('logline', e.target.value)}
                          placeholder="One to two sentence summary of your story"
                          className={`min-h-[60px] ${formErrors.logline ? 'border-red-500' : ''}`}
                          maxLength={200}
                          required
                        />
                        <div className="flex justify-between items-center">
                          <p
                            className={`text-xs ${formData.logline.length > 200 ? 'text-red-600' : 'text-muted-foreground'}`}
                          >
                            {formData.logline.length}/200 characters
                          </p>
                          {formErrors.logline && (
                            <p className="text-xs text-red-600">{formErrors.logline}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="synopsis">Synopsis *</Label>
                        <Textarea
                          id="synopsis"
                          value={formData.synopsis}
                          onChange={e => updateField('synopsis', e.target.value)}
                          placeholder="1-2 page detailed summary including the ending"
                          className={`min-h-[150px] ${formErrors.synopsis ? 'border-red-500' : ''}`}
                          maxLength={2000}
                          required
                        />
                        <div className="flex justify-between items-center">
                          <p
                            className={`text-xs ${formData.synopsis.length > 2000 ? 'text-red-600' : 'text-muted-foreground'}`}
                          >
                            {formData.synopsis.length}/2000 characters
                          </p>
                          {formErrors.synopsis && (
                            <p className="text-xs text-red-600">{formErrors.synopsis}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Optional Fields - Progressive Disclosure */}
                    <div className="space-y-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowOptionalFields(!showOptionalFields)}
                        className="w-full"
                      >
                        {showOptionalFields ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-2" />
                            Hide Optional Fields
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Show Optional Fields (Query Letter, Bio, etc.)
                          </>
                        )}
                      </Button>

                      {showOptionalFields && (
                        <div className="space-y-4 pt-2">
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Additional Materials (Optional)
                          </h3>

                          {formData.type === 'book' && (
                            <div className="space-y-2">
                              <Label htmlFor="queryLetter">Query Letter</Label>
                              <Textarea
                                id="queryLetter"
                                value={formData.queryLetter}
                                onChange={e => updateField('queryLetter', e.target.value)}
                                placeholder="Professional query letter (recommended for books/novels)"
                                className="min-h-[120px]"
                                maxLength={1000}
                              />
                              <p className="text-xs text-muted-foreground">
                                {formData.queryLetter.length}/1000 characters
                              </p>
                            </div>
                          )}

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="targetAudience">Target Audience</Label>
                              <Input
                                id="targetAudience"
                                value={formData.targetAudience}
                                onChange={e => updateField('targetAudience', e.target.value)}
                                placeholder="e.g., Young Adult, Adult Fiction"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="comparableWorks">Comparable Works</Label>
                              <Input
                                id="comparableWorks"
                                value={formData.comparableWorks}
                                onChange={e => updateField('comparableWorks', e.target.value)}
                                placeholder="Similar successful works"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="authorBio">Author Bio</Label>
                            <Textarea
                              id="authorBio"
                              value={formData.authorBio}
                              onChange={e => updateField('authorBio', e.target.value)}
                              placeholder="Your writing background and relevant experience"
                              className="min-h-[100px]"
                              maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground">
                              {formData.authorBio.length}/500 characters
                            </p>
                          </div>
                        </div>
                      )}
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
  )
}
