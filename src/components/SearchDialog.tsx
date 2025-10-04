'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/src/components/ui/dialog'
import { Input } from '@/src/components/ui/input'
import { Search, FileText, Hash } from 'lucide-react'

interface SearchResult {
  id: string
  type: 'chapter' | 'scene'
  title: string
  chapterTitle?: string
  preview?: string
}

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
  chapters: Array<{ id: string; title: string }>
  scenes: Array<{ id: string; title: string; chapter_id: string; content?: string }>
  onNavigate: (sceneId: string) => void
}

export function SearchDialog({ isOpen, onClose, chapters, scenes, onNavigate }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchQuery = query.toLowerCase()
    const searchResults: SearchResult[] = []

    // Search chapters
    chapters.forEach(chapter => {
      if (chapter.title.toLowerCase().includes(searchQuery)) {
        searchResults.push({
          id: chapter.id,
          type: 'chapter',
          title: chapter.title,
        })
      }
    })

    // Search scenes
    scenes.forEach(scene => {
      const chapter = chapters.find(c => c.id === scene.chapter_id)
      if (
        scene.title.toLowerCase().includes(searchQuery) ||
        scene.content?.toLowerCase().includes(searchQuery)
      ) {
        const contentMatch = scene.content?.toLowerCase().indexOf(searchQuery)
        const preview =
          contentMatch !== undefined && contentMatch >= 0
            ? scene.content?.substring(Math.max(0, contentMatch - 40), contentMatch + 100)
            : undefined

        searchResults.push({
          id: scene.id,
          type: 'scene',
          title: scene.title,
          chapterTitle: chapter?.title,
          preview,
        })
      }
    })

    setResults(searchResults.slice(0, 10)) // Limit to 10 results
    setSelectedIndex(0)
  }, [query, chapters, scenes])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        handleSelect(results[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'scene') {
      onNavigate(result.id)
      onClose()
      setQuery('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search chapters and scenes..."
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {results.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {results.map((result, idx) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${
                  idx === selectedIndex ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.type === 'chapter' ? (
                    <Hash className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{result.title}</div>
                    {result.chapterTitle && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {result.chapterTitle}
                      </div>
                    )}
                    {result.preview && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        ...{result.preview}...
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : query.trim() ? (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No results found</p>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start typing to search...</p>
          </div>
        )}

        <div className="px-4 py-2 border-t border-border bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press ↑↓ to navigate, Enter to select</span>
            <span>ESC to close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
