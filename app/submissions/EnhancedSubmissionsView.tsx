'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
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
  Download,
  BarChart3,
  Sparkles,
  Bell,
  Star,
  MoreVertical,
  Calendar,
  CheckSquare,
} from 'lucide-react'
import Link from 'next/link'
import type { Manuscript, Submission, User as SupabaseUser } from '@/src/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'
import {
  createManuscriptAction,
  createSubmissionAction,
  withdrawSubmissionAction,
} from '@/app/actions/submissions'
import { DatabaseService } from '@/src/lib/database'
import { FileUpload } from '@/src/components/file-upload'
import { differenceInDays } from 'date-fns'

interface EnhancedSubmissionsViewProps {
  user: (User & { profile?: SupabaseUser }) | null
  manuscripts: Manuscript[]
  submissions: Submission[]
}

interface SubmissionWithManuscript extends Submission {
  manuscript?: Manuscript
}

interface FormData {
  title: string
  logline: string
  synopsis: string
  genre: string
  type: string
  pageCount: string
  targetAudience: string
  comparableWorks: string
  authorBio: string
  queryLetter: string
  manuscriptFile?: { url: string; file: File } | null
}

interface Analytics {
  totalSubmissions: number
  acceptedCount: number
  rejectedCount: number
  pendingCount: number
  averageResponseTime: number | null
  acceptanceRate: number
  submissionsByStatus: Record<string, number>
  submissionsByGenre: Record<string, number>
  monthlyTrends: Array<{
    month: string
    submission_count: number
    accepted_count: number
    rejected_count: number
  }>
}

const SUBMISSION_STATUSES = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Clock,
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: AlertCircle,
  },
  shortlisted: {
    label: 'Shortlisted',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: Star,
  },
  offer_pending: {
    label: 'Offer Pending',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: AlertCircle,
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle,
  },
  contract_sent: {
    label: 'Contract Sent',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: FileText,
  },
  signed: {
    label: 'Signed',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckSquare,
  },
  rejected: { label: 'Declined', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
  withdrawn: {
    label: 'Withdrawn',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: Trash2,
  },
  revise_resubmit: {
    label: 'Revise & Resubmit',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: AlertCircle,
  },
} as const

export function EnhancedSubmissionsView({
  user,
  manuscripts: initialManuscripts,
  submissions: initialSubmissions,
}: EnhancedSubmissionsViewProps) {
  const userId = user?.profile?.id || user?.id

  const [activeTab, setActiveTab] = useState('my-submissions')
  const [manuscripts, setManuscripts] = useState<Manuscript[]>(initialManuscripts)
  const [submissions, setSubmissions] = useState<SubmissionWithManuscript[]>(
    initialSubmissions as SubmissionWithManuscript[]
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status' | 'deadline'>('newest')
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [loglineSuggestions, setLoglineSuggestions] = useState<string[]>([])
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState<FormData>({
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
    manuscriptFile: null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)

  // Load analytics
  useEffect(() => {
    if (showAnalytics && userId) {
      fetchAnalytics()
    }
  }, [showAnalytics, userId])

  // Load templates
  useEffect(() => {
    if (activeTab === 'new-submission') {
      fetchTemplates()
    }
  }, [activeTab])

  // Real-time subscription for submission status updates
  useEffect(() => {
    if (!userId) return

    const dbService = new DatabaseService()
    const supabase = dbService.getSupabaseClient()

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
            if (payload.old.status !== payload.new.status) {
              toast.success(
                `Submission status updated to: ${SUBMISSION_STATUSES[payload.new.status as keyof typeof SUBMISSION_STATUSES]?.label || payload.new.status}`
              )
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

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/submissions/analytics?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/submissions/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template && template.template_data) {
      setFormData(prev => ({
        ...prev,
        ...template.template_data,
        type: template.type,
        genre: template.genre || prev.genre,
      }))
      toast.success(`Applied ${template.name}`)

      // Increment usage count
      fetch(`/api/submissions/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'increment_usage' }),
      })
    }
  }

  const generateLogline = async () => {
    if (!formData.title || !formData.synopsis) {
      toast.error('Please enter title and synopsis first')
      return
    }

    try {
      const res = await fetch('/api/ai/generate-logline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          synopsis: formData.synopsis,
          type: formData.type,
          genre: formData.genre,
        }),
      })

      if (res.ok) {
        const { suggestions } = await res.json()
        setLoglineSuggestions(suggestions)
      }
    } catch (error) {
      console.error('Failed to generate logline:', error)
      toast.error('Failed to generate suggestions')
    }
  }

  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

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

    setIsSubmitting(true)

    try {
      const manuscriptResult = await createManuscriptAction({
        user_id: userId,
        title: formData.title,
        logline: formData.logline,
        synopsis: formData.synopsis,
        genre: formData.genre,
        type: formData.type as any,
        page_count: parseInt(formData.pageCount),
        status: 'draft',
        is_complete: true,
        query_letter: formData.queryLetter || undefined,
        target_audience: formData.targetAudience || undefined,
        comparable_works: formData.comparableWorks || undefined,
        author_bio: formData.authorBio || undefined,
        file_url: formData.manuscriptFile?.url,
        file_size: formData.manuscriptFile?.file.size,
        file_type: formData.manuscriptFile?.file.type,
      })

      if (!manuscriptResult.success || !manuscriptResult.data) {
        throw new Error(manuscriptResult.error || 'Failed to create manuscript')
      }

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
        manuscriptFile: null,
      })
      setHasAcceptedTerms(false)
      setShowOptionalFields(false)
      setLoglineSuggestions([])
      setSelectedTemplate('')

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
    } catch (error) {
      toast.error('Failed to withdraw submission')
    }
  }

  const handleBulkExport = async () => {
    if (selectedSubmissions.size === 0) {
      toast.error('Please select submissions to export')
      return
    }

    try {
      const res = await fetch(`/api/submissions/export?format=csv&userId=${userId}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `submissions-${Date.now()}.csv`
      a.click()
      toast.success('Export completed')
    } catch (error) {
      toast.error('Failed to export submissions')
    }
  }

  const calculateSLA = (submission: SubmissionWithManuscript) => {
    const daysSinceSubmission = differenceInDays(new Date(), new Date(submission.created_at))
    const slaLimit = 42 // 6 weeks
    const isOverdue = daysSinceSubmission > slaLimit && submission.status === 'pending'
    const daysRemaining = slaLimit - daysSinceSubmission

    return { daysSinceSubmission, isOverdue, daysRemaining }
  }

  const getStatusInfo = (status: string) => {
    return (
      SUBMISSION_STATUSES[status as keyof typeof SUBMISSION_STATUSES] || {
        label: status,
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: FileText,
      }
    )
  }

  // Filtered and sorted submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        s =>
          s.manuscript?.title?.toLowerCase().includes(query) ||
          s.manuscript?.genre?.toLowerCase().includes(query) ||
          s.manuscript?.type?.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter)
    }

    const sorted = [...filtered]
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else if (sortBy === 'status') {
      sorted.sort((a, b) => a.status.localeCompare(b.status))
    } else if (sortBy === 'deadline') {
      sorted.sort((a, b) => {
        const aDeadline = (a as any).response_deadline
          ? new Date((a as any).response_deadline).getTime()
          : 0
        const bDeadline = (b as any).response_deadline
          ? new Date((b as any).response_deadline).getTime()
          : 0
        return aDeadline - bDeadline
      })
    }

    return sorted
  }, [submissions, searchQuery, statusFilter, sortBy])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Analytics Toggle */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold mb-2">Manuscript Submissions</h1>
              <p className="text-muted-foreground">
                Submit your work for professional literary representation
              </p>
            </div>
            <Button
              variant={showAnalytics ? 'default' : 'outline'}
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>

          {/* Analytics Dashboard */}
          {showAnalytics && analytics && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Submission Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-2xl font-bold">{analytics.totalSubmissions}</p>
                        </div>
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Accepted</p>
                          <p className="text-2xl font-bold text-green-600">
                            {analytics.acceptedCount}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                          <p className="text-2xl font-bold">
                            {analytics.acceptanceRate.toFixed(1)}%
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Response</p>
                          <p className="text-2xl font-bold">
                            {analytics.averageResponseTime
                              ? `${Math.round(analytics.averageResponseTime)}d`
                              : 'N/A'}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Important Notice */}
          <Card className="mb-8 border-gray-300 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-gray-700 mt-0.5" />
                <div className="text-gray-800 dark:text-gray-300">
                  <p className="font-medium mb-1">Your IP is Protected</p>
                  <p className="text-sm">
                    All submissions are confidential and only shared with verified industry
                    professionals. You retain all rights to your work.
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
                          {Object.entries(SUBMISSION_STATUSES).map(([value, { label }]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
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
                          <SelectItem value="deadline">By Deadline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedSubmissions.size > 0 && (
                    <div className="flex items-center space-x-2 mb-4 p-3 bg-muted rounded-lg">
                      <Badge variant="secondary">{selectedSubmissions.size} selected</Badge>
                      <Button size="sm" variant="outline" onClick={handleBulkExport}>
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSubmissions(new Set())}
                      >
                        Clear
                      </Button>
                    </div>
                  )}

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
                      {filteredSubmissions.map(submission => {
                        const statusInfo = getStatusInfo(submission.status)
                        const sla = calculateSLA(submission)
                        const StatusIcon = statusInfo.icon

                        return (
                          <div
                            key={submission.id}
                            className="border border-literary-border rounded-lg p-4 hover:border-gray-400 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={selectedSubmissions.has(submission.id)}
                                  onChange={e => {
                                    const newSet = new Set(selectedSubmissions)
                                    if (e.target.checked) {
                                      newSet.add(submission.id)
                                    } else {
                                      newSet.delete(submission.id)
                                    }
                                    setSelectedSubmissions(newSet)
                                  }}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold">
                                      {submission.manuscript?.title || 'Unknown Title'}
                                    </h3>
                                    <div className="flex items-center space-x-2 ml-4">
                                      <StatusIcon className="h-4 w-4" />
                                      <Badge variant="outline" className={statusInfo.color}>
                                        {statusInfo.label}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                                    <span className="flex items-center">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {new Date(submission.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {sla.daysSinceSubmission} days ago
                                    </span>
                                    <span>Type: {submission.manuscript?.type || 'Unknown'}</span>
                                    <span>Genre: {submission.manuscript?.genre || 'Unknown'}</span>
                                    {(submission as any).internal_rating && (
                                      <span className="flex items-center">
                                        <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                        {(submission as any).internal_rating}/10
                                      </span>
                                    )}
                                  </div>

                                  {sla.isOverdue && (
                                    <Alert variant="destructive" className="mt-2 mb-2">
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertDescription>
                                        Overdue by {Math.abs(sla.daysRemaining)} days
                                      </AlertDescription>
                                    </Alert>
                                  )}

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
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 mt-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setSelectedSubmission(
                                          selectedSubmission === submission.id
                                            ? null
                                            : submission.id
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
                          </div>
                        )
                      })}
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
                    Follow industry best practices - submit query materials first.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Template Selection */}
                    {templates.length > 0 && (
                      <div className="space-y-2">
                        <Label>Quick Start Template</Label>
                        <div className="flex items-center space-x-2">
                          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a template (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              {templates.map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name} {template.is_public && '(Public)'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => selectedTemplate && applyTemplate(selectedTemplate)}
                            disabled={!selectedTemplate}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}

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
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Type *</Label>
                          <Select
                            value={formData.type}
                            onValueChange={value => updateField('type', value)}
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
                            value={formData.genre}
                            onChange={e => updateField('genre', e.target.value)}
                            placeholder="e.g., Drama, Comedy, Thriller"
                            required
                          />
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
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="logline">Logline *</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generateLogline}
                            disabled={!formData.title || !formData.synopsis}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Suggestions
                          </Button>
                        </div>
                        <Textarea
                          id="logline"
                          value={formData.logline}
                          onChange={e => updateField('logline', e.target.value)}
                          placeholder="One to two sentence summary of your story"
                          className="min-h-[60px]"
                          maxLength={200}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.logline.length}/200 characters
                        </p>

                        {loglineSuggestions.length > 0 && (
                          <div className="space-y-2 mt-3">
                            <p className="text-sm font-medium">AI Suggestions:</p>
                            {loglineSuggestions.map((suggestion, idx) => (
                              <Button
                                key={idx}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full text-left justify-start h-auto py-2 px-3"
                                onClick={() => updateField('logline', suggestion)}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="synopsis">Synopsis *</Label>
                        <Textarea
                          id="synopsis"
                          value={formData.synopsis}
                          onChange={e => updateField('synopsis', e.target.value)}
                          placeholder="1-2 page detailed summary including the ending"
                          className="min-h-[150px]"
                          maxLength={2000}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.synopsis.length}/2000 characters
                        </p>
                      </div>

                      {/* File Upload */}
                      <FileUpload
                        label="Upload Manuscript (Optional)"
                        description="PDF or DOCX, max 10MB"
                        onUploadComplete={(url, file) => {
                          updateField('manuscriptFile', { url, file })
                        }}
                        onRemove={() => updateField('manuscriptFile', null)}
                        existingFile={
                          formData.manuscriptFile
                            ? {
                                name: formData.manuscriptFile.file.name,
                                url: formData.manuscriptFile.url,
                              }
                            : undefined
                        }
                      />
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
                          I have read and agree to the Literary Agency Terms & Submission
                          Guidelines. I understand that Ottopen will act as my literary agent with a
                          15% commission on any successful deals.
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
