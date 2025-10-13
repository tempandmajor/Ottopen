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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Star,
  Bookmark,
  Search,
  Plus,
  Crown,
  Building,
  Calendar,
  ChevronRight,
  ExternalLink,
  Send,
  BookmarkCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
  Share2,
  Edit,
  Trash2,
  X,
} from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Job, JobApplication, User as SupabaseUser } from '@/src/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'
import {
  createJobAction,
  saveJobAction,
  unsaveJobAction,
  applyToJobAction,
} from '@/app/actions/jobs'
import { DatabaseService } from '@/src/lib/database'

interface PostJobFormProps {
  userId: string
  accountType: string
  onJobCreated: (job: Job) => void
}

interface OpportunitiesViewProps {
  user: (User & { profile?: SupabaseUser }) | null
  initialJobs: Job[]
  initialSavedJobs: string[]
  initialApplications: JobApplication[]
}

interface FormErrors {
  title?: string
  company?: string
  location?: string
  description?: string
  requirements?: string
  compensation?: string
}

type JobType = 'freelance' | 'contract' | 'full_time' | 'part_time' | 'project_based'
type Category =
  | 'writing'
  | 'screenwriting'
  | 'editing'
  | 'development'
  | 'production'
  | 'representation'
type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive'
type CompensationType = 'hourly' | 'project' | 'salary' | 'commission' | 'undisclosed'
type SortOption = 'newest' | 'oldest' | 'compensation' | 'deadline'

function PostJobForm({ userId, accountType, onJobCreated }: PostJobFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [jobData, setJobData] = useState({
    title: '',
    company: '',
    location: '',
    remote_ok: false,
    job_type: 'freelance' as JobType,
    category: 'writing' as Category,
    experience_level: 'entry' as ExperienceLevel,
    description: '',
    requirements: '',
    compensation_type: 'hourly' as CompensationType,
    compensation_min: '',
    compensation_max: '',
    currency: 'USD',
    deadline: '',
  })

  const updateField = useCallback((field: string, value: any) => {
    setJobData(prev => ({ ...prev, [field]: value }))
    setFormErrors(prev => ({ ...prev, [field]: undefined }))
  }, [])

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!jobData.title.trim()) errors.title = 'Title is required'
    if (!jobData.company.trim()) errors.company = 'Company is required'
    if (!jobData.location.trim()) errors.location = 'Location is required'
    if (!jobData.description.trim()) errors.description = 'Description is required'
    if (jobData.description.length > 2000)
      errors.description = 'Description must be 2000 characters or less'
    if (!jobData.requirements.trim()) errors.requirements = 'Requirements are required'
    if (jobData.requirements.length > 1000)
      errors.requirements = 'Requirements must be 1000 characters or less'

    if (jobData.compensation_type !== 'undisclosed') {
      const min = parseInt(jobData.compensation_min)
      const max = parseInt(jobData.compensation_max)
      if (jobData.compensation_min && jobData.compensation_max && min > max) {
        errors.compensation = 'Minimum compensation must be less than maximum'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createJobAction({
        poster_id: userId,
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        remote_ok: jobData.remote_ok,
        job_type: jobData.job_type,
        category: jobData.category,
        experience_level: jobData.experience_level,
        description: jobData.description,
        requirements: jobData.requirements,
        compensation_type: jobData.compensation_type,
        compensation_min: jobData.compensation_min ? parseInt(jobData.compensation_min) : undefined,
        compensation_max: jobData.compensation_max ? parseInt(jobData.compensation_max) : undefined,
        currency: jobData.currency,
        deadline: jobData.deadline || undefined,
        is_featured: false,
        is_active: true,
      })

      if (result.success && result.data) {
        setJobData({
          title: '',
          company: '',
          location: '',
          remote_ok: false,
          job_type: 'freelance',
          category: 'writing',
          experience_level: 'entry',
          description: '',
          requirements: '',
          compensation_type: 'hourly',
          compensation_min: '',
          compensation_max: '',
          currency: 'USD',
          deadline: '',
        })
        setFormErrors({})
        toast.success('Job posted successfully!')
        onJobCreated(result.data)
      } else {
        toast.error(result.error || 'Failed to create job posting')
      }
    } catch (error) {
      toast.error('Failed to create job posting')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="job-title">Job Title *</Label>
          <Input
            id="job-title"
            value={jobData.title}
            onChange={e => updateField('title', e.target.value)}
            placeholder="e.g., Freelance Screenwriter"
            required
            className={formErrors.title ? 'border-red-500' : ''}
          />
          {formErrors.title && <p className="text-xs text-red-600">{formErrors.title}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company/Organization *</Label>
          <Input
            id="company"
            value={jobData.company}
            onChange={e => updateField('company', e.target.value)}
            placeholder="e.g., Creative Studios LLC"
            required
            className={formErrors.company ? 'border-red-500' : ''}
          />
          {formErrors.company && <p className="text-xs text-red-600">{formErrors.company}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={jobData.location}
            onChange={e => updateField('location', e.target.value)}
            placeholder="e.g., Los Angeles, CA"
            required
            className={formErrors.location ? 'border-red-500' : ''}
          />
          {formErrors.location && <p className="text-xs text-red-600">{formErrors.location}</p>}
        </div>
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={jobData.remote_ok}
              onChange={e => updateField('remote_ok', e.target.checked)}
            />
            <span>Remote OK</span>
          </Label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="job-type">Job Type *</Label>
          <Select value={jobData.job_type} onValueChange={value => updateField('job_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="freelance">Freelance</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="full_time">Full-time</SelectItem>
              <SelectItem value="part_time">Part-time</SelectItem>
              <SelectItem value="project_based">Project-based</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={jobData.category} onValueChange={value => updateField('category', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="writing">Writing</SelectItem>
              <SelectItem value="screenwriting">Screenwriting</SelectItem>
              <SelectItem value="editing">Editing</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="representation">Representation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">Experience Level *</Label>
          <Select
            value={jobData.experience_level}
            onValueChange={value => updateField('experience_level', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry Level</SelectItem>
              <SelectItem value="mid">Mid Level</SelectItem>
              <SelectItem value="senior">Senior Level</SelectItem>
              <SelectItem value="executive">Executive Level</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Job Description *</Label>
        <Textarea
          id="description"
          value={jobData.description}
          onChange={e => updateField('description', e.target.value)}
          placeholder="Describe the role, responsibilities, and what you're looking for..."
          className={`min-h-[120px] ${formErrors.description ? 'border-red-500' : ''}`}
          maxLength={2000}
          required
        />
        <div className="flex justify-between items-center">
          <p
            className={`text-xs ${jobData.description.length > 2000 ? 'text-red-600' : 'text-muted-foreground'}`}
          >
            {jobData.description.length}/2000 characters
          </p>
          {formErrors.description && (
            <p className="text-xs text-red-600">{formErrors.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements">Requirements *</Label>
        <Textarea
          id="requirements"
          value={jobData.requirements}
          onChange={e => updateField('requirements', e.target.value)}
          placeholder="List the skills, experience, and qualifications needed..."
          className={`min-h-[100px] ${formErrors.requirements ? 'border-red-500' : ''}`}
          maxLength={1000}
          required
        />
        <div className="flex justify-between items-center">
          <p
            className={`text-xs ${jobData.requirements.length > 1000 ? 'text-red-600' : 'text-muted-foreground'}`}
          >
            {jobData.requirements.length}/1000 characters
          </p>
          {formErrors.requirements && (
            <p className="text-xs text-red-600">{formErrors.requirements}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="comp-type">Compensation Type</Label>
          <Select
            value={jobData.compensation_type}
            onValueChange={value => updateField('compensation_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="salary">Salary</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
              <SelectItem value="undisclosed">Undisclosed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {jobData.compensation_type !== 'undisclosed' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="comp-min">Min Amount</Label>
              <Input
                id="comp-min"
                type="number"
                min="0"
                value={jobData.compensation_min}
                onChange={e => updateField('compensation_min', e.target.value)}
                placeholder="e.g., 50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comp-max">Max Amount</Label>
              <Input
                id="comp-max"
                type="number"
                min="0"
                value={jobData.compensation_max}
                onChange={e => updateField('compensation_max', e.target.value)}
                placeholder="e.g., 100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={jobData.currency}
                onValueChange={value => updateField('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {formErrors.compensation && <p className="text-xs text-red-600">{formErrors.compensation}</p>}

      <div className="space-y-2">
        <Label htmlFor="deadline">Application Deadline (Optional)</Label>
        <Input
          id="deadline"
          type="date"
          value={jobData.deadline}
          onChange={e => updateField('deadline', e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Posting Job...
          </>
        ) : (
          'Post Job'
        )}
      </Button>
    </form>
  )
}

export function OpportunitiesView({
  user,
  initialJobs,
  initialSavedJobs,
  initialApplications,
}: OpportunitiesViewProps) {
  const userId = user?.profile?.id || user?.id

  const [activeTab, setActiveTab] = useState('browse')
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedJobType, setSelectedJobType] = useState('all')
  const [selectedExperience, setSelectedExperience] = useState('all')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [savedJobs, setSavedJobs] = useState<string[]>(initialSavedJobs)
  const [userApplications, setUserApplications] = useState<JobApplication[]>(initialApplications)
  const [expandedJobs, setExpandedJobs] = useState<string[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showJobModal, setShowJobModal] = useState(false)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [isSavingJob, setIsSavingJob] = useState<string | null>(null)
  const [salaryRange, setSalaryRange] = useState({ min: 0, max: 500000 })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    portfolioLinks: '',
    resume: null as File | null,
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null)

  // Real-time subscription for new jobs
  useEffect(() => {
    if (!userId) return

    const dbService = new DatabaseService()
    const supabase = dbService.getSupabaseClient()
    if (!supabase) {
      console.warn('Supabase client not available for real-time updates')
      return
    }

    const channel = supabase
      .channel('jobs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
        },
        payload => {
          const newJob = payload.new as Job
          setJobs(prev => [newJob, ...prev])

          // Show toast if job matches user's filters
          const matchesFilters =
            (selectedCategory === 'all' || newJob.category === selectedCategory) &&
            (selectedJobType === 'all' || newJob.job_type === selectedJobType) &&
            (!remoteOnly || newJob.remote_ok)

          if (matchesFilters) {
            toast.success(`New ${newJob.category} opportunity posted!`)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
        },
        payload => {
          const updatedJob = payload.new as Job
          setJobs(prev => prev.map(job => (job.id === updatedJob.id ? updatedJob : job)))
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId, selectedCategory, selectedJobType, remoteOnly])

  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs.filter(job => job.is_active)

    // Search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      filtered = filtered.filter(
        job =>
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(job => job.category === selectedCategory)
    }

    // Job type filter
    if (selectedJobType !== 'all') {
      filtered = filtered.filter(job => job.job_type === selectedJobType)
    }

    // Experience filter
    if (selectedExperience !== 'all') {
      filtered = filtered.filter(job => job.experience_level === selectedExperience)
    }

    // Remote only filter
    if (remoteOnly) {
      filtered = filtered.filter(job => job.remote_ok)
    }

    // Salary range filter
    filtered = filtered.filter(job => {
      if (job.compensation_type === 'undisclosed') return true
      const jobMax = job.compensation_max || 0
      return jobMax >= salaryRange.min && jobMax <= salaryRange.max
    })

    // Sort
    const sorted = [...filtered]
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else if (sortBy === 'compensation') {
      sorted.sort((a, b) => (b.compensation_max || 0) - (a.compensation_max || 0))
    } else if (sortBy === 'deadline') {
      sorted.sort((a, b) => {
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      })
    }

    return sorted
  }, [
    jobs,
    searchTerm,
    selectedCategory,
    selectedJobType,
    selectedExperience,
    remoteOnly,
    sortBy,
    salaryRange,
  ])

  // Pagination
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedJobs.slice(startIndex, endIndex)
  }, [filteredAndSortedJobs, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedJobs.length / itemsPerPage)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [
    searchTerm,
    selectedCategory,
    selectedJobType,
    selectedExperience,
    remoteOnly,
    sortBy,
    salaryRange,
  ])

  const handleSaveJob = async (jobId: string) => {
    if (!userId) {
      toast.error('Please log in to save jobs')
      return
    }

    setIsSavingJob(jobId)
    try {
      if (savedJobs.includes(jobId)) {
        const result = await unsaveJobAction(userId, jobId)
        if (result.success) {
          setSavedJobs(prev => prev.filter(id => id !== jobId))
          toast.success('Job removed from saved list')
        } else {
          toast.error(result.error || 'Failed to remove job')
        }
      } else {
        const result = await saveJobAction(userId, jobId)
        if (result.success) {
          setSavedJobs(prev => [...prev, jobId])
          toast.success('Job saved successfully')
        } else {
          toast.error(result.error || 'Failed to save job')
        }
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSavingJob(null)
    }
  }

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job)
    setShowJobModal(true)
  }

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job)
    setShowApplicationModal(true)
  }

  const handleShareJob = (job: Job) => {
    const url = `${window.location.origin}/opportunities?job=${job.id}`
    navigator.clipboard.writeText(url)
    toast.success('Job link copied to clipboard!')
  }

  const toggleExpandJob = (jobId: string) => {
    setExpandedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    )
  }

  const handleSubmitApplication = async () => {
    if (!userId || !selectedJob) {
      toast.error('Please log in to apply')
      return
    }

    if (!applicationData.coverLetter.trim()) {
      toast.error('Please provide a cover letter')
      return
    }

    setIsApplying(true)
    try {
      const result = await applyToJobAction(
        selectedJob.id,
        userId,
        applicationData.coverLetter,
        applicationData.portfolioLinks || undefined
      )

      if (result.success) {
        toast.success('Application submitted successfully!')
        setShowApplicationModal(false)
        setApplicationData({ coverLetter: '', portfolioLinks: '', resume: null })
        // Refresh applications list
        setUserApplications(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            job_id: selectedJob.id,
            applicant_id: userId,
            cover_letter: applicationData.coverLetter,
            portfolio_links: applicationData.portfolioLinks || null,
            resume_url: null,
            status: 'pending',
            applied_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as JobApplication,
        ])
      } else {
        toast.error(result.error || 'Failed to submit application')
      }
    } catch (error) {
      toast.error('An error occurred while submitting your application')
    } finally {
      setIsApplying(false)
    }
  }

  const myPostedJobs = useMemo(() => {
    return jobs.filter(job => job.poster_id === userId)
  }, [jobs, userId])

  const formatCompensation = (job: Job) => {
    if (job.compensation_type === 'undisclosed') return 'Compensation undisclosed'

    const currency = job.currency === 'USD' ? '$' : job.currency

    if (job.compensation_min && job.compensation_max) {
      return `${currency}${job.compensation_min.toLocaleString()} - ${currency}${job.compensation_max.toLocaleString()}`
    } else if (job.compensation_min) {
      return `${currency}${job.compensation_min.toLocaleString()}+`
    }

    return 'Competitive compensation'
  }

  const getDeadlineStatus = (deadline: string | null) => {
    if (!deadline) return null

    const today = new Date()
    const deadlineDate = new Date(deadline)
    const daysUntil = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil < 0) return { text: 'Closed', color: 'text-red-600', urgent: true }
    if (daysUntil === 0) return { text: 'Closes today!', color: 'text-red-600', urgent: true }
    if (daysUntil <= 3)
      return { text: `Closes in ${daysUntil} days`, color: 'text-orange-600', urgent: true }
    return {
      text: `Closes ${deadlineDate.toLocaleDateString()}`,
      color: 'text-gray-700',
      urgent: false,
    }
  }

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      freelance: 'Freelance',
      contract: 'Contract',
      full_time: 'Full-time',
      part_time: 'Part-time',
      project_based: 'Project-based',
    }
    return labels[type] || type
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      writing: 'Writing',
      screenwriting: 'Screenwriting',
      editing: 'Editing',
      development: 'Development',
      production: 'Production',
      representation: 'Representation',
    }
    return labels[category] || category
  }

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'hired':
        return 'bg-green-50 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'shortlisted':
        return 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      case 'rejected':
        return 'bg-red-50 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      case 'reviewing':
        return 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
    }
  }

  const canAccessPremiumJobs = () => {
    return user?.profile?.account_tier !== 'free'
  }

  const savedJobsData = useMemo(() => {
    return jobs.filter(job => savedJobs.includes(job.id))
  }, [jobs, savedJobs])

  return (
    <div className="min-h-screen bg-background">
      <Navigation serverUser={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold mb-2">Career Opportunities</h1>
            <p className="text-muted-foreground">
              Exclusive jobs from industry partners - agents, producers, publishers, and studios
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="browse" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Browse Jobs</span>
                <span className="sm:hidden">Browse</span>
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center space-x-2">
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">Saved Jobs</span>
                <span className="sm:hidden">Saved</span>
                {savedJobs.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {savedJobs.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">My Applications</span>
                <span className="sm:hidden">Applied</span>
                {userApplications.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {userApplications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="post" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Post Job</span>
                <span className="sm:hidden">Post</span>
              </TabsTrigger>
            </TabsList>

            {/* Browse Jobs Tab */}
            <TabsContent value="browse" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                      <div className="lg:col-span-2">
                        <Label htmlFor="search">Search</Label>
                        <Input
                          id="search"
                          placeholder="Job title, company, keywords..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="writing">Writing</SelectItem>
                            <SelectItem value="screenwriting">Screenwriting</SelectItem>
                            <SelectItem value="editing">Editing</SelectItem>
                            <SelectItem value="development">Development</SelectItem>
                            <SelectItem value="production">Production</SelectItem>
                            <SelectItem value="representation">Representation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Job Type</Label>
                        <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="freelance">Freelance</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="full_time">Full-time</SelectItem>
                            <SelectItem value="part_time">Part-time</SelectItem>
                            <SelectItem value="project_based">Project-based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Experience</Label>
                        <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="entry">Entry Level</SelectItem>
                            <SelectItem value="mid">Mid Level</SelectItem>
                            <SelectItem value="senior">Senior Level</SelectItem>
                            <SelectItem value="executive">Executive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Sort By</Label>
                        <Select
                          value={sortBy}
                          onValueChange={value => setSortBy(value as SortOption)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="compensation">Highest Pay</SelectItem>
                            <SelectItem value="deadline">Closing Soon</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="remote-only"
                          checked={remoteOnly}
                          onChange={e => setRemoteOnly(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="remote-only" className="cursor-pointer">
                          Remote Only
                        </Label>
                      </div>
                      <div>
                        <Label>Salary Range (Max USD)</Label>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex-1">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={salaryRange.min}
                              onChange={e =>
                                setSalaryRange(prev => ({
                                  ...prev,
                                  min: parseInt(e.target.value) || 0,
                                }))
                              }
                              min="0"
                              step="1000"
                            />
                          </div>
                          <span className="text-muted-foreground">to</span>
                          <div className="flex-1">
                            <Input
                              type="number"
                              placeholder="Max"
                              value={salaryRange.max}
                              onChange={e =>
                                setSalaryRange(prev => ({
                                  ...prev,
                                  max: parseInt(e.target.value) || 500000,
                                }))
                              }
                              min="0"
                              step="1000"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Showing jobs up to ${salaryRange.max.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Access Notice */}
              {!canAccessPremiumJobs() && (
                <Card className="border-gray-300 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Crown className="h-5 w-5 text-gray-700" />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-400">
                            Unlock Premium Opportunities
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-600">
                            Access exclusive high-paying jobs from top industry partners
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" className="border-gray-300 hover:bg-gray-100">
                        Upgrade Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Job Listings */}
              <div className="space-y-4">
                {paginatedJobs.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No jobs found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm ||
                        selectedCategory !== 'all' ||
                        selectedJobType !== 'all' ||
                        selectedExperience !== 'all'
                          ? 'Try adjusting your filters to see more opportunities'
                          : 'Check back soon for new opportunities'}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {paginatedJobs.map(job => {
                  const deadlineStatus = getDeadlineStatus(job.deadline || null)
                  const isExpanded = expandedJobs.includes(job.id)

                  return (
                    <Card
                      key={job.id}
                      className={`transition-all hover:shadow-md ${job.is_featured ? 'border-primary bg-primary/5' : ''}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {job.is_featured && (
                                <Badge
                                  variant="default"
                                  className="bg-gray-100 text-gray-800 border-gray-300"
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                              <Badge variant="outline">{getCategoryLabel(job.category)}</Badge>
                              <Badge variant="secondary">{getJobTypeLabel(job.job_type)}</Badge>
                              {deadlineStatus?.urgent && (
                                <Badge
                                  className={`${deadlineStatus.color} bg-transparent border-current`}
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  {deadlineStatus.text}
                                </Badge>
                              )}
                            </div>
                            <h3
                              className="text-xl font-semibold mb-2 cursor-pointer hover:text-primary"
                              onClick={() => handleViewDetails(job)}
                            >
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center space-x-1">
                                <Building className="h-4 w-4" />
                                <span>{job.company}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location}</span>
                                {job.remote_ok && (
                                  <span className="text-gray-700">• Remote OK</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <p className="text-muted-foreground mb-4 line-clamp-2">
                              {job.description}
                            </p>

                            {/* Expanded content */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t space-y-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Full Description</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {job.description}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Requirements</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {job.requirements}
                                  </p>
                                </div>
                                <Button onClick={() => handleApplyClick(job)} className="w-full">
                                  Apply Now
                                </Button>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4 text-gray-700" />
                                <span className="font-medium text-gray-700">
                                  {formatCompensation(job)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{job.applications_count || 0} applicants</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveJob(job.id)}
                              disabled={isSavingJob === job.id}
                              className={
                                savedJobs.includes(job.id) ? 'bg-primary/10 border-primary' : ''
                              }
                            >
                              {isSavingJob === job.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : savedJobs.includes(job.id) ? (
                                <BookmarkCheck className="h-4 w-4" />
                              ) : (
                                <Bookmark className="h-4 w-4" />
                              )}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleShareJob(job)}>
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleExpandJob(job.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {job.deadline && !isExpanded && (
                          <div className="flex items-center space-x-1 text-sm text-gray-700 bg-gray-50 dark:bg-gray-900/20 p-2 rounded">
                            <Clock className="h-4 w-4" />
                            <span>Application deadline: {deadlineStatus?.text}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Pagination */}
              {filteredAndSortedJobs.length > itemsPerPage && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                        {Math.min(currentPage * itemsPerPage, filteredAndSortedJobs.length)} of{' '}
                        {filteredAndSortedJobs.length} jobs
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8"
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Saved Jobs Tab */}
            <TabsContent value="saved" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Opportunities ({savedJobs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {savedJobsData.length === 0 ? (
                    <div className="text-center py-8">
                      <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No saved jobs yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Save interesting opportunities to easily find them later.
                      </p>
                      <Button onClick={() => setActiveTab('browse')}>Browse Opportunities</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedJobsData.map(job => (
                        <Card key={job.id} className="hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3
                                  className="font-semibold mb-1 cursor-pointer hover:text-primary"
                                  onClick={() => handleViewDetails(job)}
                                >
                                  {job.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {job.company} • {job.location}
                                  {job.remote_ok && ' • Remote OK'}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <Badge variant="outline">{getCategoryLabel(job.category)}</Badge>
                                  <Badge variant="secondary">{getJobTypeLabel(job.job_type)}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatCompensation(job)}
                                </p>
                              </div>
                              <div className="flex flex-col space-y-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSaveJob(job.id)}
                                  className="bg-primary/10 border-primary"
                                >
                                  <BookmarkCheck className="h-4 w-4" />
                                </Button>
                                <Button size="sm" onClick={() => handleApplyClick(job)}>
                                  Apply
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Applications ({userApplications.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {userApplications.length === 0 ? (
                    <div className="text-center py-8">
                      <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start applying to opportunities that match your skills and interests.
                      </p>
                      <Button onClick={() => setActiveTab('browse')}>Find Opportunities</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userApplications.map(application => {
                        const job = application.job || jobs.find(j => j.id === application.job_id)
                        return (
                          <Card key={application.id} className="hover:shadow-md transition-all">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold mb-1">
                                    {job?.title || 'Job Not Found'}
                                  </h3>
                                  {job && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {job.company} • {job.location}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Applied {new Date(application.applied_at).toLocaleDateString()}
                                  </p>
                                  {application.cover_letter && (
                                    <details className="mt-2">
                                      <summary className="text-xs text-primary cursor-pointer hover:underline">
                                        View Cover Letter
                                      </summary>
                                      <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                                        {application.cover_letter}
                                      </p>
                                    </details>
                                  )}
                                  {application.portfolio_links && (
                                    <div className="mt-2">
                                      <p className="text-xs text-muted-foreground">
                                        <strong>Portfolio:</strong>{' '}
                                        {application.portfolio_links.split('\n').map((link, i) => (
                                          <a
                                            key={i}
                                            href={link.trim()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                          >
                                            {link.trim()}
                                            {i <
                                              application.portfolio_links!.split('\n').length - 1 &&
                                              ', '}
                                          </a>
                                        ))}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={getApplicationStatusColor(application.status)}
                                >
                                  {application.status.charAt(0).toUpperCase() +
                                    application.status.slice(1).replace('_', ' ')}
                                </Badge>
                              </div>
                              {job && (
                                <div className="mt-3 pt-3 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(job)}
                                  >
                                    View Job Details
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Post Job Tab */}
            <TabsContent value="post" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Post a Job Opportunity</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Connect with talented writers, screenwriters, and creative professionals
                  </p>
                </CardHeader>
                <CardContent>
                  {user?.profile?.account_type === 'writer' ? (
                    <div className="text-center py-8">
                      <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Industry Partner Access Required</h3>
                      <p className="text-muted-foreground mb-4">
                        Job posting is available to agents, producers, publishers, and other
                        industry professionals.
                      </p>
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Contact Sales for Partner Account
                      </Button>
                    </div>
                  ) : (
                    <PostJobForm
                      userId={userId || ''}
                      accountType={user?.profile?.account_type || 'writer'}
                      onJobCreated={job => {
                        setJobs(prev => [job, ...prev])
                        setActiveTab('browse')
                        toast.success('Your job posting is now live!')
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Job Detail Modal */}
      <Dialog open={showJobModal} onOpenChange={setShowJobModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedJob.title}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center space-x-1">
                      <Building className="h-4 w-4" />
                      <span>{selectedJob.company}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedJob.location}</span>
                      {selectedJob.remote_ok && <span>• Remote OK</span>}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{getCategoryLabel(selectedJob.category)}</Badge>
                  <Badge variant="secondary">{getJobTypeLabel(selectedJob.job_type)}</Badge>
                  <Badge variant="outline">{selectedJob.experience_level} Level</Badge>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Compensation</h3>
                  <p className="text-lg font-medium text-primary">
                    {formatCompensation(selectedJob)}
                  </p>
                  {selectedJob.compensation_type !== 'undisclosed' && (
                    <p className="text-sm text-muted-foreground">
                      {selectedJob.compensation_type.charAt(0).toUpperCase() +
                        selectedJob.compensation_type.slice(1)}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Job Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedJob.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedJob.requirements}
                  </p>
                </div>

                {selectedJob.deadline && (
                  <div>
                    <h3 className="font-semibold mb-2">Application Deadline</h3>
                    <p className="text-muted-foreground">
                      {new Date(selectedJob.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => {
                      setShowJobModal(false)
                      handleApplyClick(selectedJob)
                    }}
                    className="flex-1"
                  >
                    Apply Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSaveJob(selectedJob.id)}
                    className={
                      savedJobs.includes(selectedJob.id) ? 'bg-primary/10 border-primary' : ''
                    }
                  >
                    {savedJobs.includes(selectedJob.id) ? (
                      <BookmarkCheck className="h-4 w-4" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => handleShareJob(selectedJob)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Application Modal */}
      <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply to {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Complete your application to {selectedJob?.company}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cover-letter">Cover Letter *</Label>
              <Textarea
                id="cover-letter"
                placeholder="Tell us why you're a great fit for this role..."
                value={applicationData.coverLetter}
                onChange={e =>
                  setApplicationData(prev => ({ ...prev, coverLetter: e.target.value }))
                }
                className="min-h-[200px] mt-1"
                maxLength={2000}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {applicationData.coverLetter.length}/2000 characters
              </p>
            </div>

            <div>
              <Label htmlFor="portfolio-links">Portfolio Links (Optional)</Label>
              <Textarea
                id="portfolio-links"
                placeholder="Add links to your portfolio, website, or relevant work samples (one per line)"
                value={applicationData.portfolioLinks}
                onChange={e =>
                  setApplicationData(prev => ({ ...prev, portfolioLinks: e.target.value }))
                }
                className="min-h-[100px] mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate multiple links with a new line
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Note about Resume Upload</h4>
              <p className="text-sm text-muted-foreground">
                Resume upload feature is coming soon. For now, please include a link to your resume
                in the portfolio links section above.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowApplicationModal(false)}
                disabled={isApplying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitApplication}
                disabled={isApplying || !applicationData.coverLetter.trim()}
              >
                {isApplying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isApplying ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
