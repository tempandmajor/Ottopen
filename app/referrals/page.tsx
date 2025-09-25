'use client'

import { Navigation } from '@/src/components/navigation'
import { Footer } from '@/src/components/footer'
import { ProtectedRoute } from '@/src/components/auth/protected-route'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { Separator } from '@/src/components/ui/separator'
import {
  Gift,
  Users,
  Copy,
  Share2,
  DollarSign,
  Calendar,
  Trophy,
  Star,
  Crown,
  CheckCircle,
  Clock,
  ExternalLink,
  Twitter,
  Linkedin,
  Mail,
  MessageSquare,
  TrendingUp,
  Award,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/src/contexts/auth-context'
import { toast } from 'react-hot-toast'

interface ReferralStats {
  totalReferrals: number
  confirmedReferrals: number
  pendingReferrals: number
  totalCredits: number
  usedCredits: number
  availableCredits: number
  currentStreak: number
  milestoneProgress: {
    current: number
    next: number
    nextMilestone: string
  }
}

interface Referral {
  id: string
  referredEmail: string
  status: string
  creditAmount: number
  referredTier: string
  createdAt: string
  confirmedAt?: string
}

export default function Referrals() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [referralCode, setReferralCode] = useState('')
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    confirmedReferrals: 0,
    pendingReferrals: 0,
    totalCredits: 0,
    usedCredits: 0,
    availableCredits: 0,
    currentStreak: 0,
    milestoneProgress: {
      current: 0,
      next: 5,
      nextMilestone: 'Ambassador',
    },
  })
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data for demo
  useEffect(() => {
    // Generate unique referral code
    const username = user?.profile?.username || user?.email?.split('@')[0] || 'user'
    setReferralCode(
      `${username.toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    )

    // Mock referral data
    setTimeout(() => {
      setStats({
        totalReferrals: 8,
        confirmedReferrals: 6,
        pendingReferrals: 2,
        totalCredits: 180, // days
        usedCredits: 30,
        availableCredits: 150,
        currentStreak: 3,
        milestoneProgress: {
          current: 6,
          next: 10,
          nextMilestone: 'Champion',
        },
      })

      setReferrals([
        {
          id: '1',
          referredEmail: 'jane.doe@email.com',
          status: 'confirmed',
          creditAmount: 30,
          referredTier: 'premium',
          createdAt: '2024-01-15',
          confirmedAt: '2024-01-16',
        },
        {
          id: '2',
          referredEmail: 'mike.writer@email.com',
          status: 'confirmed',
          creditAmount: 60,
          referredTier: 'pro',
          createdAt: '2024-01-20',
          confirmedAt: '2024-01-22',
        },
        {
          id: '3',
          referredEmail: 'sarah.agent@email.com',
          status: 'pending',
          creditAmount: 90,
          referredTier: 'external_agent',
          createdAt: '2024-01-25',
        },
      ])

      setLoading(false)
    }, 1000)
  }, [user])

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth/signup?ref=${referralCode}`
    navigator.clipboard.writeText(referralLink)
    toast.success('Referral link copied to clipboard!')
  }

  const shareOnSocial = (platform: string) => {
    const referralLink = `${window.location.origin}/auth/signup?ref=${referralCode}`
    const message =
      'Join me on Ottopen - the platform where writers get professional literary representation! Use my referral link:'

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralLink)}`,
      linkedin: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
      email: `mailto:?subject=${encodeURIComponent('Join Ottopen - Professional Literary Platform')}&body=${encodeURIComponent(`${message} ${referralLink}`)}`,
    }

    window.open(urls[platform as keyof typeof urls], '_blank')
  }

  const getMilestoneIcon = (milestone: string) => {
    switch (milestone) {
      case 'Ambassador':
        return <Star className="h-5 w-5 text-yellow-500" />
      case 'Champion':
        return <Trophy className="h-5 w-5 text-blue-500" />
      case 'Legend':
        return <Crown className="h-5 w-5 text-purple-500" />
      default:
        return <Award className="h-5 w-5 text-green-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-200 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getTierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      free: 'Free',
      premium: 'Premium',
      pro: 'Pro',
      external_agent: 'Agent',
      producer: 'Producer',
      publisher: 'Publisher',
    }
    return labels[tier] || tier
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading referral dashboard...</p>
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
              <h1 className="font-serif text-3xl font-bold mb-2">Referral Program</h1>
              <p className="text-muted-foreground">
                Earn free subscription time by inviting other writers and industry professionals
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Referrals</p>
                      <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Available Credits</p>
                      <p className="text-2xl font-bold">{stats.availableCredits}</p>
                      <p className="text-xs text-muted-foreground">days of service</p>
                    </div>
                    <Gift className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Streak</p>
                      <p className="text-2xl font-bold">{stats.currentStreak}</p>
                      <p className="text-xs text-muted-foreground">consecutive months</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Next Milestone</p>
                      <p className="text-lg font-bold">{stats.milestoneProgress.nextMilestone}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.milestoneProgress.current}/{stats.milestoneProgress.next} referrals
                      </p>
                    </div>
                    {getMilestoneIcon(stats.milestoneProgress.nextMilestone)}
                  </div>
                  <Progress
                    value={(stats.milestoneProgress.current / stats.milestoneProgress.next) * 100}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center space-x-2">
                  <Gift className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="invite" className="flex items-center space-x-2">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Invite Friends</span>
                  <span className="sm:hidden">Invite</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Referral History</span>
                  <span className="sm:hidden">History</span>
                </TabsTrigger>
                <TabsTrigger value="rewards" className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4" />
                  <span className="hidden sm:inline">Rewards</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Share your unique link</p>
                          <p className="text-sm text-muted-foreground">
                            Send your referral link to writers and industry professionals
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">2</span>
                        </div>
                        <div>
                          <p className="font-medium">They sign up & subscribe</p>
                          <p className="text-sm text-muted-foreground">
                            When they create a paid account, you both get credits
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">3</span>
                        </div>
                        <div>
                          <p className="font-medium">Earn free subscription time</p>
                          <p className="text-sm text-muted-foreground">
                            Credits automatically apply to extend your subscription
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Reward Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Premium Writer ($20/month)</span>
                          <Badge variant="outline">1 month credit</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Pro Writer ($50/month)</span>
                          <Badge variant="outline">2 months credit</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">External Agent ($200/month)</span>
                          <Badge variant="outline">3 months credit</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Producer ($500/month)</span>
                          <Badge variant="outline">6 months credit</Badge>
                        </div>
                        <Separator />
                        <div className="text-xs text-muted-foreground">
                          Credits expire after 12 months. Higher-tier referrals earn more credits.
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Invite Tab */}
              <TabsContent value="invite" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Referral Link</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Referral Code</Label>
                      <div className="flex space-x-2">
                        <Input value={referralCode} readOnly className="font-mono" />
                        <Button variant="outline" onClick={copyReferralLink}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Full Referral Link</Label>
                      <div className="flex space-x-2">
                        <Input
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/signup?ref=${referralCode}`}
                          readOnly
                          className="text-xs"
                        />
                        <Button variant="outline" onClick={copyReferralLink}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="mb-3 block">Share on Social Media</Label>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => shareOnSocial('twitter')}>
                          <Twitter className="h-4 w-4 mr-2" />
                          Twitter
                        </Button>
                        <Button variant="outline" onClick={() => shareOnSocial('linkedin')}>
                          <Linkedin className="h-4 w-4 mr-2" />
                          LinkedIn
                        </Button>
                        <Button variant="outline" onClick={() => shareOnSocial('email')}>
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Invitation Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                        <p>
                          <strong>Target the right audience:</strong> Focus on writers,
                          screenwriters, agents, and producers who would benefit from our platform
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                        <p>
                          <strong>Personalize your message:</strong> Explain how Ottopen has helped
                          your career and why they should join
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                        <p>
                          <strong>Share success stories:</strong> Mention specific benefits like
                          manuscript representation or job opportunities
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                        <p>
                          <strong>Follow up:</strong> Check if they need help with their account
                          setup or have questions about the platform
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Referral History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {referrals.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No referrals yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Start inviting friends to earn your first credits!
                        </p>
                        <Button onClick={() => setActiveTab('invite')}>Start Referring</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {referrals.map(referral => (
                          <div
                            key={referral.id}
                            className="border border-literary-border rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{referral.referredEmail}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Signed up {new Date(referral.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {getStatusBadge(referral.status)}
                                <p className="text-sm text-muted-foreground mt-1">
                                  {getTierLabel(referral.referredTier)} plan
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Credit earned:</span>
                              <span className="font-medium text-green-600">
                                +{referral.creditAmount} days
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rewards Tab */}
              <TabsContent value="rewards" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Milestone Rewards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-literary-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Star className="h-6 w-6 text-yellow-500" />
                          <div>
                            <p className="font-medium">Ambassador (5 referrals)</p>
                            <p className="text-sm text-muted-foreground">
                              20% platform fee discount + special badge
                            </p>
                          </div>
                        </div>
                        <Badge variant={stats.confirmedReferrals >= 5 ? 'default' : 'outline'}>
                          {stats.confirmedReferrals >= 5
                            ? 'Achieved'
                            : `${stats.confirmedReferrals}/5`}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-literary-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Trophy className="h-6 w-6 text-blue-500" />
                          <div>
                            <p className="font-medium">Champion (10 referrals)</p>
                            <p className="text-sm text-muted-foreground">
                              3 months Pro upgrade + priority support
                            </p>
                          </div>
                        </div>
                        <Badge variant={stats.confirmedReferrals >= 10 ? 'default' : 'outline'}>
                          {stats.confirmedReferrals >= 10
                            ? 'Achieved'
                            : `${stats.confirmedReferrals}/10`}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-literary-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Crown className="h-6 w-6 text-purple-500" />
                          <div>
                            <p className="font-medium">Legend (25 referrals)</p>
                            <p className="text-sm text-muted-foreground">
                              1 year Pro subscription + VIP networking events
                            </p>
                          </div>
                        </div>
                        <Badge variant={stats.confirmedReferrals >= 25 ? 'default' : 'outline'}>
                          {stats.confirmedReferrals >= 25
                            ? 'Achieved'
                            : `${stats.confirmedReferrals}/25`}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-literary-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Award className="h-6 w-6 text-green-500" />
                          <div>
                            <p className="font-medium">Elite Partner (50+ referrals)</p>
                            <p className="text-sm text-muted-foreground">
                              Custom partnership + revenue sharing opportunity
                            </p>
                          </div>
                        </div>
                        <Badge variant={stats.confirmedReferrals >= 50 ? 'default' : 'outline'}>
                          {stats.confirmedReferrals >= 50
                            ? 'Achieved'
                            : `${stats.confirmedReferrals}/50`}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Credit Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Total Credits Earned:</span>
                        <span className="font-bold">{stats.totalCredits} days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Credits Used:</span>
                        <span className="text-muted-foreground">{stats.usedCredits} days</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Available Credits:</span>
                        <span className="font-bold text-green-600">
                          {stats.availableCredits} days
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Credits automatically apply to extend your subscription. Credits expire
                        after 12 months.
                      </p>
                    </div>
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
