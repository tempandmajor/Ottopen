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
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/src/contexts/auth-context'
import { toast } from 'react-hot-toast'

interface Job {
  id: string
  title: string
  company: string
  location: string
  remoteOk: boolean
  jobType: string
  category: string
  experienceLevel: string
  description: string
  requirements: string
  compensationType: string
  compensationMin?: number
  compensationMax?: number
  currency: string
  deadline?: string
  isFeatured: boolean
  applicationsCount: number
  postedAt: string
  poster: {
    displayName: string
    company?: string
    accountType: string
  }
}

export default function Opportunities() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('browse')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedJobType, setSelectedJobType] = useState('all')
  const [selectedExperience, setSelectedExperience] = useState('all')
  const [savedJobs, setSavedJobs] = useState<string[]>([])

  // Load real job data from database
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true)

        // Since we don't have a jobs service yet, show a message about coming soon
        // In a real implementation, you would call a jobs API here

        // For now, show that the feature is coming soon
        setJobs([])
      } catch (error) {
        console.error('Failed to load jobs:', error)
        setJobs([])
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [])

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory
    const matchesJobType = selectedJobType === 'all' || job.jobType === selectedJobType
    const matchesExperience =
      selectedExperience === 'all' || job.experienceLevel === selectedExperience

    return matchesSearch && matchesCategory && matchesJobType && matchesExperience
  })

  const handleSaveJob = (jobId: string) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(prev => prev.filter(id => id !== jobId))
      toast.success('Job removed from saved list')
    } else {
      setSavedJobs(prev => [...prev, jobId])
      toast.success('Job saved successfully')
    }
  }

  const formatCompensation = (job: Job) => {
    if (job.compensationType === 'undisclosed') return 'Compensation undisclosed'

    const currency = job.currency === 'USD' ? '$' : job.currency

    if (job.compensationMin && job.compensationMax) {
      return `${currency}${job.compensationMin.toLocaleString()} - ${currency}${job.compensationMax.toLocaleString()}`
    } else if (job.compensationMin) {
      return `${currency}${job.compensationMin.toLocaleString()}+`
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading opportunities...</p>
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
                  <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Crown className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="font-medium text-orange-700 dark:text-orange-400">
                              Unlock Premium Opportunities
                            </p>
                            <p className="text-sm text-orange-600 dark:text-orange-500">
                              Access exclusive high-paying jobs from top industry partners
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" className="border-orange-200 hover:bg-orange-100">
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
                      className={`transition-all hover:shadow-md ${job.isFeatured ? 'border-primary bg-primary/5' : ''}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {job.isFeatured && (
                                <Badge
                                  variant="default"
                                  className="bg-yellow-100 text-yellow-800 border-yellow-200"
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                              <Badge variant="outline">{getCategoryLabel(job.category)}</Badge>
                              <Badge variant="secondary">{getJobTypeLabel(job.jobType)}</Badge>
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
                                {job.remoteOk && (
                                  <span className="text-green-600">• Remote OK</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <p className="text-muted-foreground mb-4 line-clamp-2">
                              {job.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-600">
                                  {formatCompensation(job)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{job.applicationsCount} applicants</span>
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
                          <div className="flex items-center space-x-1 text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                            <Clock className="h-4 w-4" />
                            <span>
                              Application deadline: {new Date(job.deadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {filteredJobs.length === 0 && !loading && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">Job Board Coming Soon</h3>
                        <p className="text-muted-foreground mb-4">
                          We&apos;re building partnerships with industry professionals to bring you exclusive job opportunities.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Check back soon for opportunities from agents, producers, publishers, and studios.
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
                      <p className="text-muted-foreground">
                        You have {savedJobs.length} saved job{savedJobs.length !== 1 ? 's' : ''}.
                      </p>
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
                    <div className="text-center py-8">
                      <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start applying to opportunities that match your skills and interests.
                      </p>
                      <Button onClick={() => setActiveTab('browse')}>Find Opportunities</Button>
                    </div>
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
                        <h3 className="text-lg font-medium mb-2">
                          Industry Partner Access Required
                        </h3>
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
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Job posting will be available once we launch our industry partner program.
                          We&apos;re working to connect writers with verified agents, producers, and publishers.
                        </p>
                        <Button disabled>Coming Soon</Button>
                      </div>
                    )}
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
