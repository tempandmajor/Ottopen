'use client'
import { Navigation } from '@/src/components/navigation'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Clock,
  TrendingUp,
  FileText,
  Sparkles,
  FolderOpen,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ManuscriptService } from '@/src/lib/ai-editor-service'
import type { Manuscript } from '@/src/types/ai-editor'
import type { User as SupabaseUser } from '@/src/lib/supabase'
import type { User as AuthUser } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'
import { logger } from '@/src/lib/editor-logger'

interface EditorDashboardProps {
  user: (AuthUser & { profile?: SupabaseUser }) | null
}

export function EditorDashboard({ user }: EditorDashboardProps) {
  const router = useRouter()
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadManuscripts()
  }, [user])

  const loadManuscripts = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await ManuscriptService.getUserManuscripts(user.id)
      setManuscripts(data)
    } catch (error) {
      logger.error('Failed to load manuscripts', error as Error, { userId: user?.id })
      logger.userError('Failed to load your manuscripts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateManuscript = async () => {
    if (!user) return

    try {
      const manuscript = await ManuscriptService.create(user.id, {
        title: 'Untitled Manuscript',
        genre: 'fiction',
      })
      toast.success('Manuscript created!')
      router.push(`/editor/${manuscript.id}`)
    } catch (error) {
      logger.error('Failed to create manuscript', error as Error, { userId: user?.id })
      logger.userError('Failed to create manuscript')
    }
  }

  const filteredManuscripts = manuscripts.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || m.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    totalManuscripts: manuscripts.length,
    inProgress: manuscripts.filter(m => m.status === 'draft' || m.status === 'revision').length,
    totalWords: manuscripts.reduce((sum, m) => sum + m.current_word_count, 0),
    completedThisMonth: manuscripts.filter(m => {
      if (!m.completed_at) return false
      const completedDate = new Date(m.completed_at)
      const now = new Date()
      return (
        completedDate.getMonth() === now.getMonth() &&
        completedDate.getFullYear() === now.getFullYear()
      )
    }).length,
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-serif text-3xl font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="h-8 w-8 text-primary" />
                  AI Editor
                </h1>
                <p className="text-muted-foreground">
                  Your intelligent writing companion for crafting amazing novels
                </p>
              </div>
              <Button onClick={handleCreateManuscript} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                New Manuscript
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Manuscripts</p>
                      <p className="text-2xl font-bold">{stats.totalManuscripts}</p>
                    </div>
                    <FolderOpen className="h-8 w-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold">{stats.inProgress}</p>
                    </div>
                    <Clock className="h-8 w-8 text-gray-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Words</p>
                      <p className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</p>
                    </div>
                    <FileText className="h-8 w-8 text-gray-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed (Month)</p>
                      <p className="text-2xl font-bold">{stats.completedThisMonth}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-gray-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search manuscripts..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'draft' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('draft')}
              >
                Draft
              </Button>
              <Button
                variant={filterStatus === 'revision' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('revision')}
              >
                Revision
              </Button>
              <Button
                variant={filterStatus === 'published' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('published')}
              >
                Published
              </Button>
            </div>
          </div>

          {/* Manuscripts Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your manuscripts...</p>
            </div>
          ) : filteredManuscripts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredManuscripts.map(manuscript => (
                <Link key={manuscript.id} href={`/editor/${manuscript.id}`} className="block">
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    {manuscript.cover_image_url && (
                      <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                        <Image
                          src={manuscript.cover_image_url}
                          alt={manuscript.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{manuscript.title}</CardTitle>
                          {manuscript.subtitle && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {manuscript.subtitle}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            manuscript.status === 'published'
                              ? 'default'
                              : manuscript.status === 'revision'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {manuscript.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {manuscript.genre && (
                          <p className="text-sm text-muted-foreground">Genre: {manuscript.genre}</p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress:</span>
                          <span className="font-medium">
                            {manuscript.current_word_count.toLocaleString()} /{' '}
                            {manuscript.target_word_count.toLocaleString()} words
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                (manuscript.current_word_count / manuscript.target_word_count) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground pt-2">
                          Last updated: {new Date(manuscript.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery || filterStatus !== 'all'
                  ? 'No manuscripts found'
                  : 'Start Your Writing Journey'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first manuscript and unlock the power of AI-assisted writing'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Button onClick={handleCreateManuscript} size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Create Your First Manuscript
                </Button>
              )}
            </Card>
          )}

          {/* Getting Started Guide (for new users) */}
          {manuscripts.length === 0 && !loading && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Write Faster
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    AI helps you overcome writer&apos;s block, expand scenes, and maintain momentum
                    throughout your story.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Write Better
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Get intelligent feedback on pacing, character consistency, plot holes, and prose
                    quality.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Stay Organized
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Manage characters, locations, plot threads, and research all in one place with
                    our Story Bible.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
