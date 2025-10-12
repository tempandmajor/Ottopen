'use client'
import { Navigation } from '@/src/components/navigation'

import { Footer } from '@/src/components/footer'
import { AuthorCard } from '@/src/components/author-card'
import { PostCard } from '@/src/components/post-card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import {
  Search,
  TrendingUp,
  Star,
  BookOpen,
  Sparkles,
  Users,
  Zap,
  Globe,
  DollarSign,
  FileText,
  MessageSquare,
  CheckCircle2,
  Mail,
  ChevronDown,
  ChevronUp,
  PenTool,
  Clapperboard,
  Award,
  Shield,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/src/contexts/auth-context'
import { useState, useEffect } from 'react'
import { useNavigate } from '@/src/hooks/use-navigate'
import type { User, Post } from '@/src/lib/supabase'

interface HomeViewProps {
  initialPosts: Post[]
  initialAuthors: User[]
  initialStats: {
    active_writers: number
    stories_shared: number
    published_works: number
    total_users: number
  }
}

export function HomeView({ initialPosts, initialAuthors, initialStats }: HomeViewProps) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  console.log('Homepage - userExists:', !!user, 'Loading:', loading)

  // Redirect authenticated users to feed
  useEffect(() => {
    if (!loading && user) {
      console.log('Homepage: User is authenticated, redirecting to feed')
      navigate('/feed', { replace: true })
    }
  }, [user, loading, navigate])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Handle email signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      // TODO: Integrate with email service
      console.log('Email signup:', email)
      setEmailSubmitted(true)
      setTimeout(() => {
        setEmail('')
        setEmailSubmitted(false)
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Hero Section */}
      <section className="hero-bg py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                  AI-Powered Writing Platform
                </div>
                <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Write, Collaborate, and <span className="text-primary italic">Earn</span> from
                  Your Stories
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                  The only platform combining AI-powered editing, real-time collaboration, and a
                  built-in marketplace. Join authors, screenwriters, and playwrights turning their
                  creative work into income.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="font-medium" asChild>
                  <Link href={user ? '/editor' : '/auth/signup'}>
                    {user ? 'Start Writing' : 'Join Free Today'}
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/works">Browse Works</Link>
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Free to Start</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">No Credit Card</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">
                    {initialStats.total_users > 0
                      ? `${initialStats.total_users.toLocaleString()}+ Writers`
                      : 'Join Writers Worldwide'}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-xl literary-shadow w-full h-[300px] sm:h-[350px] lg:h-[400px] overflow-hidden">
                <Image
                  src="/ottopen-image.png"
                  alt="Ottopen - Where Stories Connect"
                  fill
                  className="object-cover rounded-xl"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center">
                  <div className="text-center p-8 text-white">
                    <h3 className="text-xl font-semibold mb-2">Where Stories Come to Life</h3>
                    <p className="text-gray-200">
                      Connect with writers, share your work, and discover amazing stories
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Write and Sell Your Stories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional tools that help you create, collaborate, and monetize your creative work
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-card border border-literary-border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">AI-Powered Editor</h3>
              <p className="text-muted-foreground">
                Get real-time suggestions, grammar fixes, and creative ideas powered by advanced AI
                to enhance your writing
              </p>
            </div>

            <div className="p-6 bg-card border border-literary-border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Clapperboard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Professional Script Formatting</h3>
              <p className="text-muted-foreground">
                Industry-standard screenplay and stage play formatting with automatic beat sheets
                and structure analysis
              </p>
            </div>

            <div className="p-6 bg-card border border-literary-border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Real-Time Collaboration</h3>
              <p className="text-muted-foreground">
                Work together with co-writers, editors, and beta readers with live editing and
                commenting features
              </p>
            </div>

            <div className="p-6 bg-card border border-literary-border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Built-In Marketplace</h3>
              <p className="text-muted-foreground">
                Sell your scripts, stories, and manuscripts directly to producers, publishers, and
                readers
              </p>
            </div>

            <div className="p-6 bg-card border border-literary-border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Book Clubs & Community</h3>
              <p className="text-muted-foreground">
                Join writing sprints, book clubs, and connect with thousands of writers in your
                genre
              </p>
            </div>

            <div className="p-6 bg-card border border-literary-border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Referral Rewards</h3>
              <p className="text-muted-foreground">
                Earn cash rewards by inviting other writers to join the platform and grow your
                network
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start creating and earning from your stories in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Create Your Account</h3>
              <p className="text-muted-foreground text-sm">
                Sign up for free in seconds. No credit card required to get started
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Write & Collaborate</h3>
              <p className="text-muted-foreground text-sm">
                Use our AI editor and collaborate with other writers in real-time
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Share Your Work</h3>
              <p className="text-muted-foreground text-sm">
                Publish to the community, join book clubs, and get feedback from readers
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="font-semibold text-lg mb-2">Monetize & Grow</h3>
              <p className="text-muted-foreground text-sm">
                Sell your work, earn referral rewards, and build your author platform
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Trusted by Writers Worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what creators are saying about Ottopen
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-card border border-literary-border rounded-lg">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                &ldquo;The AI editor is a game-changer. It&rsquo;s like having a professional editor
                available 24/7. I&rsquo;ve improved my writing speed by 3x while maintaining
                quality.&rdquo;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-semibold text-primary mr-3">
                  SM
                </div>
                <div>
                  <div className="font-semibold">Sarah Martinez</div>
                  <div className="text-sm text-muted-foreground">Screenwriter</div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-card border border-literary-border rounded-lg">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                &ldquo;I sold my first script through the marketplace within 2 months of joining.
                The community feedback helped me polish it to perfection.&rdquo;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-semibold text-primary mr-3">
                  JC
                </div>
                <div>
                  <div className="font-semibold">James Chen</div>
                  <div className="text-sm text-muted-foreground">Playwright</div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-card border border-literary-border rounded-lg">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                &ldquo;The book clubs and writing sprints keep me motivated. I&rsquo;ve connected
                with amazing co-writers and completed 3 novels this year!&rdquo;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-semibold text-primary mr-3">
                  EW
                </div>
                <div>
                  <div className="font-semibold">Emma Wilson</div>
                  <div className="text-sm text-muted-foreground">Novelist</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 pt-12 border-t border-literary-border">
            <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span className="font-medium">SSL Encrypted</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span className="font-medium">Trusted Platform</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span className="font-medium">Active Community</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Feed */}
            <div className="lg:col-span-2 space-y-8">
              {/* Genre Discovery */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-2xl font-semibold">Explore by Genre</h2>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/works">View All</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Link
                    href="/search?genre=sci-fi"
                    className="p-4 bg-card border border-literary-border rounded-lg hover:shadow-md transition-shadow text-center"
                  >
                    <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold">Sci-Fi</h3>
                    <p className="text-xs text-muted-foreground mt-1">Futuristic tales</p>
                  </Link>
                  <Link
                    href="/search?genre=drama"
                    className="p-4 bg-card border border-literary-border rounded-lg hover:shadow-md transition-shadow text-center"
                  >
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold">Drama</h3>
                    <p className="text-xs text-muted-foreground mt-1">Powerful stories</p>
                  </Link>
                  <Link
                    href="/search?genre=mystery"
                    className="p-4 bg-card border border-literary-border rounded-lg hover:shadow-md transition-shadow text-center"
                  >
                    <Search className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold">Mystery</h3>
                    <p className="text-xs text-muted-foreground mt-1">Solve the puzzle</p>
                  </Link>
                  <Link
                    href="/search?genre=romance"
                    className="p-4 bg-card border border-literary-border rounded-lg hover:shadow-md transition-shadow text-center"
                  >
                    <Star className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold">Romance</h3>
                    <p className="text-xs text-muted-foreground mt-1">Love stories</p>
                  </Link>
                  <Link
                    href="/search?genre=fantasy"
                    className="p-4 bg-card border border-literary-border rounded-lg hover:shadow-md transition-shadow text-center"
                  >
                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold">Fantasy</h3>
                    <p className="text-xs text-muted-foreground mt-1">Magic & adventure</p>
                  </Link>
                  <Link
                    href="/search?genre=thriller"
                    className="p-4 bg-card border border-literary-border rounded-lg hover:shadow-md transition-shadow text-center"
                  >
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold">Thriller</h3>
                    <p className="text-xs text-muted-foreground mt-1">Edge of your seat</p>
                  </Link>
                </div>
              </div>

              {/* Recent Posts */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-2xl font-semibold">Recent from Community</h2>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/feed">View Feed</Link>
                  </Button>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className="p-6 bg-card border border-literary-border rounded-lg animate-pulse"
                        >
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : initialPosts.length > 0 ? (
                    initialPosts
                      .slice(0, 3)
                      .map(post => (
                        <PostCard
                          key={post.id}
                          author={
                            post.user?.display_name || post.user?.username || 'Unknown Author'
                          }
                          avatar={post.user?.avatar_url}
                          time={new Date(post.created_at).toLocaleDateString()}
                          content={post.content}
                          type="discussion"
                          likes={post.likes_count || 0}
                          comments={post.comments_count || 0}
                        />
                      ))
                  ) : (
                    <div className="text-center py-8 p-6 bg-card border border-literary-border rounded-lg">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Be the first to share your story with the community!
                      </p>
                      {!user && (
                        <Button asChild>
                          <Link href="/auth/signup">Join Now</Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Email Capture */}
              {!user && (
                <div className="p-6 border border-primary/20 rounded-lg bg-primary/5">
                  <div className="flex items-center space-x-2 mb-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Stay Updated</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get writing tips, feature updates, and exclusive content delivered to your inbox
                  </p>
                  {emailSubmitted ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Thanks for subscribing!</span>
                    </div>
                  ) : (
                    <form onSubmit={handleEmailSignup} className="space-y-2">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full"
                      />
                      <Button type="submit" className="w-full">
                        Subscribe
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {/* Quick CTA */}
              <div className="p-6 border border-literary-border rounded-lg bg-card">
                <h4 className="font-semibold mb-2">Ready to Start?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Join thousands of writers creating amazing stories
                </p>
                {!user && (
                  <Button className="w-full" asChild>
                    <Link href="/auth/signup">Join Free Today</Link>
                  </Button>
                )}
              </div>

              {/* FAQ Accordion */}
              <div className="p-6 border border-literary-border rounded-lg bg-card">
                <h3 className="font-serif text-xl font-semibold mb-4">Frequently Asked</h3>
                <div className="space-y-3">
                  {[
                    {
                      q: 'Is Ottopen free to use?',
                      a: 'Yes! Ottopen is free to start. You can write, collaborate, and share your work without any upfront costs. Premium features are available for advanced users.',
                    },
                    {
                      q: 'Can I sell my work?',
                      a: 'Absolutely! Our built-in marketplace allows you to sell scripts, manuscripts, and stories directly to buyers. You keep the majority of the revenue.',
                    },
                    {
                      q: 'What file formats are supported?',
                      a: 'We support PDF, DOCX, TXT, and industry-standard screenplay formats. Export in any format you need.',
                    },
                    {
                      q: 'How does the AI editor work?',
                      a: 'Our AI provides real-time suggestions for grammar, style, plot structure, and character development while you write.',
                    },
                    {
                      q: 'Is my work protected?',
                      a: 'Yes. All content is encrypted, and you retain full copyright ownership. We never claim rights to your work.',
                    },
                  ].map((faq, index) => (
                    <div key={index} className="border-b border-literary-border pb-3 last:border-0">
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <span className="font-medium text-sm">{faq.q}</span>
                        {openFaq === index ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>
                      {openFaq === index && (
                        <p className="text-sm text-muted-foreground mt-2 pr-6">{faq.a}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Badge */}
              <div className="p-6 border border-literary-border rounded-lg bg-card">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Privacy First</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your data is encrypted and secure. Control who sees your work and profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
