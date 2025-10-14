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
  Film,
  Clock,
  SortAsc,
  SortDesc,
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface Script {
  id: string
  title: string
  script_type: string
  genre: string[]
  page_count: number
  created_at: string
  updated_at: string
}

type ViewMode = 'grid' | 'list'
type SortBy = 'recent' | 'title' | 'page_count'

export function ScriptsBrowser() {
  const router = useRouter()
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('recent')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    loadScripts()
  }, [])

  const loadScripts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/scripts')
      if (response.ok) {
        const data = await response.json()
        setScripts(data.scripts || [])
      }
    } catch (error) {
      console.error('Failed to load scripts:', error)
      toast.error('Failed to load scripts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    if (typeof window !== 'undefined') {
      window.open('/scripts/workspace?new=true', '_blank', 'noopener,noreferrer')
    } else {
      router.push('/scripts/workspace?new=true')
    }
  }

  const handleOpenScript = (scriptId: string) => {
    if (typeof window !== 'undefined') {
      window.open(`/scripts/workspace?tabs=${scriptId}`, '_blank', 'noopener,noreferrer')
    } else {
      router.push(`/scripts/workspace?tabs=${scriptId}`)
    }
  }

  const handleDuplicate = async (script: Script) => {
    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${script.title} (Copy)`,
          script_type: script.script_type,
          genre: script.genre,
        }),
      })

      if (response.ok) {
        toast.success('Script duplicated')
        loadScripts()
      }
    } catch (error) {
      toast.error('Failed to duplicate script')
    }
  }

  const handleDelete = async (scriptId: string) => {
    if (!confirm('Are you sure you want to delete this script?')) return

    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Script deleted')
        setScripts(prev => prev.filter(s => s.id !== scriptId))
      }
    } catch (error) {
      toast.error('Failed to delete script')
    }
  }

  const formatScriptType = (type: string) => {
    const types: Record<string, string> = {
      screenplay: 'Screenplay',
      tv_pilot: 'TV Pilot',
      stage_play: 'Stage Play',
      radio_drama: 'Radio Drama',
      documentary: 'Documentary',
      nonfiction_book: 'Non-Fiction',
    }
    return types[type] || type
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

  // Filter and sort scripts
  const filteredScripts = scripts
    .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'recent':
          comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'page_count':
          comparison = b.page_count - a.page_count
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
            <h1 className="text-3xl font-bold">Script Editor</h1>
            <p className="text-muted-foreground mt-1">
              Write screenplays, TV scripts, and plays with industry-standard formatting
            </p>
          </div>
          <Button onClick={handleCreateNew} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Script
          </Button>
        </div>

        {/* Search and controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search scripts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort: {sortBy === 'recent' ? 'Recent' : sortBy === 'title' ? 'Title' : 'Pages'}
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
              <DropdownMenuItem onClick={() => setSortBy('page_count')}>
                Page Count
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
          ) : filteredScripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Film className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No scripts found' : 'No scripts yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first script to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Script
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredScripts.map(script => (
                <div
                  key={script.id}
                  className="group relative border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleOpenScript(script.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold truncate mb-1">{script.title}</h3>
                      <span className="text-xs text-muted-foreground">
                        {formatScriptType(script.script_type)}
                      </span>
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
                        <DropdownMenuItem onClick={() => handleDuplicate(script)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(script.id)}
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
                      <span>{script.page_count} pages</span>
                      {script.genre.length > 0 && (
                        <span className="text-xs">{script.genre[0]}</span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(script.updated_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredScripts.map(script => (
                <div
                  key={script.id}
                  className="group flex items-center justify-between border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => handleOpenScript(script.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Film className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{script.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{formatScriptType(script.script_type)}</span>
                        <span>{script.page_count} pages</span>
                        {script.genre.length > 0 && <span>{script.genre.join(', ')}</span>}
                        <span className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {formatDate(script.updated_at)}
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
                      <DropdownMenuItem onClick={() => handleDuplicate(script)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(script.id)}
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
