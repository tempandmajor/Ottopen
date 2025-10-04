'use client'

import { useState } from 'react'
import {
  Search,
  ExternalLink,
  Calendar,
  Filter,
  Loader2,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react'

interface ResearchResult {
  answer: string
  citations: string[]
  model: string
  tokensUsed: {
    total: number
    prompt: number
    completion: number
  }
}

interface StoryContext {
  genre?: string
  setting?: string
  timePeriod?: string
  characters?: string[]
  currentScene?: string
}

interface ResearchPanelProps {
  manuscriptId: string
  storyContext?: StoryContext
  onAddToStoryBible?: (content: string, title: string) => void
}

export default function ResearchPanel({
  manuscriptId,
  storyContext,
  onAddToStoryBible,
}: ResearchPanelProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recencyFilter, setRecencyFilter] = useState<'day' | 'week' | 'month' | 'year' | null>(null)
  const [copiedText, setCopiedText] = useState(false)
  const [useContext, setUseContext] = useState(true)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          manuscriptId,
          recencyFilter,
          storyContext: useContext ? storyContext : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Research request failed')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to complete research')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          Research Assistant
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Powered by Perplexity AI with real-time web search
        </p>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a research question... (e.g., 'What is the typical layout of a Victorian mansion?')"
            className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-800 dark:text-white"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="absolute bottom-2 right-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-2 mt-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Time filter:</span>
            <div className="flex gap-1">
              {(['day', 'week', 'month', 'year'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setRecencyFilter(recencyFilter === period ? null : period)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    recencyFilter === period
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Story Context Toggle */}
          {storyContext && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useContext}
                  onChange={e => setUseContext(e.target.checked)}
                  className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  Use story context{' '}
                  {storyContext.genre && (
                    <span className="text-gray-400">({storyContext.genre})</span>
                  )}
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Answer */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Answer</h3>
                <button
                  onClick={() => copyToClipboard(result.answer)}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                  title="Copy answer"
                >
                  {copiedText ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {result.answer}
              </p>
            </div>

            {/* Citations */}
            {result.citations && result.citations.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Sources ({result.citations.length})
                </h3>
                <div className="space-y-2">
                  {result.citations.map((citation, index) => (
                    <a
                      key={index}
                      href={citation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-300 break-all group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {citation}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {onAddToStoryBible && (
                <button
                  onClick={() => onAddToStoryBible(result.answer, query)}
                  className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Add to Story Bible
                </button>
              )}
              <button
                onClick={() => copyToClipboard(result.answer)}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                {copiedText ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Answer
                  </>
                )}
              </button>
            </div>

            {/* Meta */}
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              Model: {result.model} • Tokens: {result.tokensUsed.total.toLocaleString()}
            </div>
          </div>
        )}

        {!result && !error && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Ask a Research Question
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              Get real-time, cited answers to help with world-building, fact-checking, and story
              research.
            </p>
            <div className="mt-6 space-y-2 text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400">Example queries:</p>
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <li>• &quot;What is the typical layout of a Victorian mansion?&quot;</li>
                <li>• &quot;How does forensic blood spatter analysis work?&quot;</li>
                <li>• &quot;What are common Japanese tea ceremony protocols?&quot;</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
