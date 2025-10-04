'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Search, Loader2, ExternalLink, Copy, BookOpen, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface ResearchResult {
  query: string
  answer: string
  citations: string[]
  timestamp: Date
}

interface ScriptResearchPanelProps {
  scriptId: string
  scriptContext: {
    genre: string[]
    logline?: string
    setting?: string
    timePeriod?: string
    scriptType: string
  }
}

export function ScriptResearchPanel({ scriptId, scriptContext }: ScriptResearchPanelProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ResearchResult[]>([])
  const [recencyFilter, setRecencyFilter] = useState<'day' | 'week' | 'month' | 'year' | undefined>(
    undefined
  )
  const [useContext, setUseContext] = useState(true)

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/scripts/${scriptId}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          recencyFilter,
          scriptContext: useContext ? scriptContext : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Research request failed')
      }

      const data = await response.json()

      const newResult: ResearchResult = {
        query,
        answer: data.answer,
        citations: data.citations || [],
        timestamp: new Date(),
      }

      setResults(prev => [newResult, ...prev])
      setQuery('')
    } catch (error) {
      console.error('Research error:', error)
      toast.error('Failed to perform research. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Research</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Powered by Perplexity AI</p>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Research historical details, locations, technical info..."
            disabled={isLoading}
          />
          <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={useContext}
                onChange={e => setUseContext(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
              <span>
                Use script context
                {scriptContext.genre.length > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({scriptContext.genre.join(', ')})
                  </span>
                )}
              </span>
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              variant={recencyFilter === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecencyFilter(recencyFilter === 'day' ? undefined : 'day')}
            >
              <Clock className="h-3 w-3 mr-1" />
              Day
            </Button>
            <Button
              variant={recencyFilter === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecencyFilter(recencyFilter === 'week' ? undefined : 'week')}
            >
              <Clock className="h-3 w-3 mr-1" />
              Week
            </Button>
            <Button
              variant={recencyFilter === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecencyFilter(recencyFilter === 'month' ? undefined : 'month')}
            >
              <Clock className="h-3 w-3 mr-1" />
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1 p-4">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-2">Research Anything</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Get accurate, cited information for your screenplay. Research historical details,
              technical procedures, locations, and more.
            </p>
            {scriptContext.genre.length > 0 && (
              <p className="text-xs text-muted-foreground mt-4">
                Context: {scriptContext.genre.join(', ')} screenplay
                {scriptContext.timePeriod && ` set in ${scriptContext.timePeriod}`}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                {/* Query */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm">{result.query}</h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                {/* Answer */}
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {result.answer}
                </div>

                {/* Citations */}
                {result.citations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Sources</p>
                    <div className="space-y-1">
                      {result.citations.map((citation, idx) => (
                        <a
                          key={idx}
                          href={citation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate">{citation}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.answer)}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Answer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Research is powered by Perplexity AI and searches real-time web sources with citations.
        </p>
      </div>
    </div>
  )
}
