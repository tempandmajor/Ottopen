'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Grid3x3,
  List,
  MoreVertical,
  Trash2,
  Copy,
  Share2,
  FileText,
  Clock,
  SortAsc,
  SortDesc,
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface Manuscript {
  id: string
  title: string
  genre: string | null
  current_word_count: number
  target_word_count: number | null
  created_at: string
  updated_at: string
}

type ViewMode = 'grid' | 'list'
type SortBy = 'recent' | 'title' | 'word_count'

export function ManuscriptsBrowser() {
  const router = useRouter()
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('recent')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    loadManuscripts()
  }, [])

  const loadManuscripts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/manuscripts')
      if (response.ok) {
        const data = await response.json()
        setManuscripts(data.manuscripts || [])
      }
    } catch (error) {
      console.error('Failed to load manuscripts:', error)
      toast.error('Failed to load manuscripts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    if (typeof window !== 'undefined') {
      window.open('/editor/workspace?new=true', '_blank', 'noopener,noreferrer')
    } else {
      router.push('/editor/workspace?new=true')
    }
  }

  const handleOpenManuscript = (manuscriptId: string) => {
    if (typeof window !== 'undefined') {
      window.open(`/editor/workspace?tabs=${manuscriptId}`, '_blank', 'noopener,noreferrer')
    } else {
      router.push(`/editor/workspace?tabs=${manuscriptId}`)
    }
  }

  const handleDuplicate = async (manuscript: Manuscript) => {
    try {
      const response = await fetch('/api/manuscripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${manuscript.title} (Copy)`,
          genre: manuscript.genre,
        }),
      })

      if (response.ok) {
        toast.success('Manuscript duplicated')
        loadManuscripts()
      }
    } catch (error) {
      toast.error('Failed to duplicate manuscript')
    }
  }

  const handleDelete = async (manuscriptId: string) => {
    if (!confirm('Are you sure you want to delete this manuscript?')) return

    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Manuscript deleted')
        setManuscripts(prev => prev.filter(m => m.id !== manuscriptId))
      }
    } catch (error) {
      toast.error('Failed to delete manuscript')
    }
  }

  const formatWordCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return date.toLocaleDateString()
  }

  // Filter and sort manuscripts
  const filteredManuscripts = manuscripts
    .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'recent':
          comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'word_count':
          comparison = b.current_word_count - a.current_word_count
          break
      }
      return sortAsc ? -comparison : comparison
    })

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">AI Editor</h1>
            <p className="text-muted-foreground mt-1">
              Write novels, stories, and manuscripts with AI assistance
            </p>
          </div>
          <Button onClick={handleCreateNew} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Manuscript
          </Button>
        </div>

        {/* Search and controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search manuscripts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort: {sortBy === 'recent' ? 'Recent' : sortBy === 'title' ? 'Title' : 'Word Count'}
                {sortAsc ? (
                  <SortAsc className="ml-2 h-4 w-4" />
                ) : (
                  <SortDesc className="ml-2 h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('recent')}>Recent</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('title')}>Title</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('word_count')}>
                Word Count
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortAsc(!sortAsc)}>
                {sortAsc ? 'Ascending' : 'Descending'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex gap-1 border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredManuscripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No manuscripts found' : 'No manuscripts yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first manuscript to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Manuscript
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredManuscripts.map(manuscript => (
                <div
                  key={manuscript.id}
                  className="group relative border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleOpenManuscript(manuscript.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold truncate mb-1">{manuscript.title}</h3>
                      {manuscript.genre && (
                        <span className="text-xs text-muted-foreground">{manuscript.genre}</span>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDuplicate(manuscript)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(manuscript.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{formatWordCount(manuscript.current_word_count)} words</span>
                      {manuscript.target_word_count && (
                        <span className="text-xs">
                          of {formatWordCount(manuscript.target_word_count)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(manuscript.updated_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredManuscripts.map(manuscript => (
                <div
                  key={manuscript.id}
                  className="group flex items-center justify-between border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => handleOpenManuscript(manuscript.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{manuscript.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {manuscript.genre && <span>{manuscript.genre}</span>}
                        <span>{formatWordCount(manuscript.current_word_count)} words</span>
                        <span className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {formatDate(manuscript.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDuplicate(manuscript)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(manuscript.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
