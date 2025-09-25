'use client'

import { Navigation } from '@/src/components/navigation'
import { Footer } from '@/src/components/footer'
import { AuthorCard } from '@/src/components/author-card'
import { PostCard } from '@/src/components/post-card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Search, TrendingUp, Star, BookOpen } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/src/contexts/auth-context'
import { useState, useEffect } from 'react'
import { useNavigate } from '@/src/hooks/use-navigate'
import { dbService } from '@/src/lib/database'
import type { User, Post } from '@/src/lib/supabase'

export default function Home() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [featuredAuthors, setFeaturedAuthors] = useState<User[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [appStats, setAppStats] = useState({
    active_writers: 0,
    stories_shared: 0,
    published_works: 0,
    total_users: 0
  })

  console.log('Homepage - userExists:', !!user, 'Loading:', loading)

  // Redirect authenticated users to feed
  useEffect(() => {
    if (!loading && user) {
      console.log('Homepage: User is authenticated, redirecting to feed')
      navigate('/feed', { replace: true })
    }
  }, [user, loading, navigate])

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true)

        // Load application statistics
        const stats = await dbService.getApplicationStatistics()
        setAppStats(stats)

        // Load recent posts
        const posts = await dbService.getPosts({ limit: 6, published: true })
        setRecentPosts(posts)

        // Load featured authors (users with most followers or posts)
        const authors = await dbService.searchUsers('', 6)
        setFeaturedAuthors(authors)
      } catch (error) {
        console.error('Failed to load homepage data:', error)
        // Set empty states instead of mock data
        setRecentPosts([])
        setFeaturedAuthors([])
      } finally {
        setDataLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
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
                <h1 className="font-sans text-5xl lg:text-6xl font-bold leading-tight">
                  Where <span className="italic">Stories</span> Connect
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Join a community of authors, screenwriters, and playwrights. Share your work,
                  discover new voices, and build meaningful connections in the literary world.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Button size="lg" className="font-medium" asChild>
                    <Link href="/dashboard">Start Writing</Link>
                  </Button>
                ) : (
                  <Button size="lg" className="font-medium" asChild>
                    <Link href="/auth/signup">Start Writing</Link>
                  </Button>
                )}
                <Button variant="outline" size="lg" asChild>
                  <Link href="/authors">Explore Community</Link>
                </Button>
              </div>

              <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>{appStats.active_writers > 0 ? `${appStats.active_writers.toLocaleString()}+ Active Writers` : 'Growing Community'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>{appStats.stories_shared > 0 ? `${appStats.stories_shared.toLocaleString()}+ Stories Shared` : 'Stories Welcome'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{appStats.published_works > 0 ? `${appStats.published_works.toLocaleString()}+ Published` : 'Success Stories'}</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-xl literary-shadow w-full h-[400px] overflow-hidden">
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

      {/* Search Section */}
      <section className="py-12 px-4 border-b border-literary-border">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search authors, works, or discussions..."
                  className="pl-10 h-12 text-base"
                />
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Feed */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold">Discover Writers</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/search?type=posts">Filter</Link>
                </Button>
              </div>

              <div className="space-y-4">
                {dataLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading posts...</p>
                  </div>
                ) : recentPosts.length > 0 ? (
                  recentPosts.map(post => (
                    <PostCard
                      key={post.id}
                      author={post.user?.display_name || post.user?.username || 'Unknown Author'}
                      avatar={post.user?.avatar_url}
                      time={new Date(post.created_at).toLocaleDateString()}
                      content={post.content}
                      type="discussion"
                      likes={post.likes_count || 0}
                      comments={post.comments_count || 0}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No posts available yet.</p>
                    {!user && (
                      <p className="mt-2">
                        <Link href="/auth/signup" className="text-primary hover:underline">
                          Join the community
                        </Link>{' '}
                        to start sharing your work!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-xl font-semibold mb-4">Featured Authors</h3>
                <div className="space-y-4">
                  {dataLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading authors...</p>
                    </div>
                  ) : featuredAuthors.length > 0 ? (
                    featuredAuthors.map(author => (
                      <AuthorCard
                        key={author.id}
                        name={author.display_name || author.username}
                        specialty={author.specialty || 'Writer'}
                        location={author.location || 'Location not specified'}
                        works={0}
                        followers={0}
                        bio={author.bio || 'No bio available.'}
                        avatar={author.avatar_url}
                        tags={author.specialty ? [author.specialty] : ['Writer']}
                      />
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No authors found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
