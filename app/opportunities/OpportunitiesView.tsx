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
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Star,
  Bookmark,
  Filter,
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
} from 'lucide-react'
import { useState } from 'react'
import type { Job, JobApplication, User as SupabaseUser } from '@/src/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'
import { createJobAction, saveJobAction, unsaveJobAction } from '@/app/actions/jobs'

interface PostJobFormProps {
  userId: string
  accountType: string
  onJobCreated: () => void
}

interface OpportunitiesViewProps {
  user: (User & { profile?: SupabaseUser }) | null
  initialJobs: Job[]
  initialSavedJobs: string[]
  initialApplications: JobApplication[]
}

function PostJobForm({ userId, accountType, onJobCreated }: PostJobFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jobData, setJobData] = useState({
    title: '',
    company: '',
    location: '',
    remote_ok: false,
    job_type: 'freelance' as const,
    category: 'writing' as const,
    experience_level: 'entry' as const,
    description: '',
    requirements: '',
    compensation_type: 'hourly' as const,
    compensation_min: '',
    compensation_max: '',
    currency: 'USD',
    deadline: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

      if (result.success) {
        // Reset form
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
        toast.success('Job posted successfully!')
        onJobCreated()
      } else {
        toast.error(result.error || 'Failed to create job posting')
      }
    } catch (error) {
      console.error('Failed to create job:', error)
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
            onChange={e => setJobData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Freelance Screenwriter"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company/Organization *</Label>
          <Input
            id="company"
            value={jobData.company}
            onChange={e => setJobData(prev => ({ ...prev, company: e.target.value }))}
            placeholder="e.g., Creative Studios LLC"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={jobData.location}
            onChange={e => setJobData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., Los Angeles, CA"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={jobData.remote_ok}
              onChange={e => setJobData(prev => ({ ...prev, remote_ok: e.target.checked }))}
            />
            <span>Remote OK</span>
          </Label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="job-type">Job Type *</Label>
          <Select
            value={jobData.job_type}
            onValueChange={value => setJobData(prev => ({ ...prev, job_type: value as any }))}
          >
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
          <Select
            value={jobData.category}
            onValueChange={value => setJobData(prev => ({ ...prev, category: value as any }))}
          >
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
            onValueChange={value =>
              setJobData(prev => ({ ...prev, experience_level: value as any }))
            }
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
          onChange={e => setJobData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the role, responsibilities, and what you're looking for..."
          className="min-h-[120px]"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements">Requirements *</Label>
        <Textarea
          id="requirements"
          value={jobData.requirements}
          onChange={e => setJobData(prev => ({ ...prev, requirements: e.target.value }))}
          placeholder="List the skills, experience, and qualifications needed..."
          className="min-h-[100px]"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="comp-type">Compensation Type</Label>
          <Select
            value={jobData.compensation_type}
            onValueChange={value =>
              setJobData(prev => ({ ...prev, compensation_type: value as any }))
            }
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

        <div className="space-y-2">
          <Label htmlFor="comp-min">Min Amount</Label>
          <Input
            id="comp-min"
            type="number"
            value={jobData.compensation_min}
            onChange={e => setJobData(prev => ({ ...prev, compensation_min: e.target.value }))}
            placeholder="e.g., 50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comp-max">Max Amount</Label>
          <Input
            id="comp-max"
            type="number"
            value={jobData.compensation_max}
            onChange={e => setJobData(prev => ({ ...prev, compensation_max: e.target.value }))}
            placeholder="e.g., 100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={jobData.currency}
            onValueChange={value => setJobData(prev => ({ ...prev, currency: value }))}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Application Deadline (Optional)</Label>
        <Input
          id="deadline"
          type="date"
          value={jobData.deadline}
          onChange={e => setJobData(prev => ({ ...prev, deadline: e.target.value }))}
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
  const [activeTab, setActiveTab] = useState('browse')
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedJobType, setSelectedJobType] = useState('all')
  const [selectedExperience, setSelectedExperience] = useState('all')
  const [savedJobs, setSavedJobs] = useState<string[]>(initialSavedJobs)
  const [userApplications, setUserApplications] = useState<JobApplication[]>(initialApplications)

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory
    const matchesJobType = selectedJobType === 'all' || job.job_type === selectedJobType
    const matchesExperience =
      selectedExperience === 'all' || job.experience_level === selectedExperience

    return matchesSearch && matchesCategory && matchesJobType && matchesExperience
  })

  const handleSaveJob = async (jobId: string) => {
    const userId = user?.profile?.id || user?.id
    if (!userId) {
      toast.error('Please log in to save jobs')
      return
    }

    try {
      if (savedJobs.includes(jobId)) {
        const result = await unsaveJobAction(userId, jobId)
        if (result.success) {
          setSavedJobs(prev => prev.filter(id => id !== jobId))
          toast.success('Job removed from saved list')
        } else {
          toast.error(result.error || 'Failed to remove job from saved list')
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
      console.error('Error saving job:', error)
      toast.error('An error occurred while saving the job')
    }
  }

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

  const canAccessPremiumJobs = () => {
    return user?.profile?.account_tier !== 'free'
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

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
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">My Applications</span>
                <span className="sm:hidden">Applied</span>
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
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                  </div>
                </CardContent>
              </Card>

              {/* Premium Access Notice for Free Users */}
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
                {filteredJobs.map(job => (
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
                          </div>
                          <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center space-x-1">
                              <Building className="h-4 w-4" />
                              <span>{job.company}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{job.location}</span>
                              {job.remote_ok && <span className="text-gray-700">• Remote OK</span>}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {job.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4 text-gray-700" />
                              <span className="font-medium text-gray-700">
                                {formatCompensation(job)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{job.applications_count} applicants</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSaveJob(job.id)}
                            className={
                              savedJobs.includes(job.id) ? 'bg-primary/10 border-primary' : ''
                            }
                          >
                            {savedJobs.includes(job.id) ? (
                              <BookmarkCheck className="h-4 w-4" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </Button>
                          <Button size="sm">
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                      {job.deadline && (
                        <div className="flex items-center space-x-1 text-sm text-gray-700 bg-gray-50 dark:bg-gray-900/20 p-2 rounded">
                          <Clock className="h-4 w-4" />
                          <span>
                            Application deadline: {new Date(job.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {filteredJobs.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Jobs Available</h3>
                      <p className="text-muted-foreground mb-4">
                        There are currently no job opportunities matching your criteria.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters or check back later for new opportunities.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Saved Jobs Tab */}
            <TabsContent value="saved" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  {savedJobs.length === 0 ? (
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
                      {jobs
                        .filter(job => savedJobs.includes(job.id))
                        .map(job => (
                          <Card key={job.id} className="hover:shadow-md transition-all">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold mb-1">{job.title}</h3>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {job.company} • {job.location}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Saved • {getCategoryLabel(job.category)} •{' '}
                                    {getJobTypeLabel(job.job_type)}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSaveJob(job.id)}
                                >
                                  <BookmarkCheck className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      <p className="text-sm text-muted-foreground text-center">
                        You have {savedJobs.length} saved job{savedJobs.length !== 1 ? 's' : ''}.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Applications</CardTitle>
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
                      {userApplications.map(application => (
                        <Card key={application.id} className="hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold mb-1">
                                  {(application as any).job?.title || 'Unknown Job'}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {(application as any).job?.company} •{' '}
                                  {(application as any).job?.location}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Applied {new Date(application.applied_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  application.status === 'hired'
                                    ? 'default'
                                    : application.status === 'shortlisted'
                                      ? 'secondary'
                                      : application.status === 'rejected'
                                        ? 'destructive'
                                        : 'outline'
                                }
                              >
                                {application.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <p className="text-sm text-muted-foreground text-center">
                        You have {userApplications.length} application
                        {userApplications.length !== 1 ? 's' : ''}.
                      </p>
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
                      userId={user?.profile?.id || user?.id || ''}
                      accountType={user?.profile?.account_type || 'writer'}
                      onJobCreated={() => {
                        // Jobs will be refreshed automatically via server action revalidation
                        window.location.reload()
                      }}
                    />
                  )}
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
