'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/src/components/ui/input'
import { Card } from '@/src/components/ui/card'
import { Search, TrendingUp, Clock, X } from 'lucide-react'
import { cn } from '@/src/lib/utils'

interface SearchSuggestion {
  text: string
  type: 'popular' | 'recent' | 'trending'
  count?: number
}

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export function SearchAutocomplete({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  className,
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [trendingSearches, setTrendingSearches] = useState<SearchSuggestion[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches')
    if (recent) {
      setRecentSearches(JSON.parse(recent))
    }
  }, [])

  // Fetch trending searches on mount
  useEffect(() => {
    fetchTrendingSearches()
  }, [])

  // Fetch suggestions when query changes
  useEffect(() => {
    if (value.length >= 2) {
      fetchSuggestions(value)
    } else {
      setSuggestions([])
    }
  }, [value])

  const fetchTrendingSearches = async () => {
    try {
      const res = await fetch('/api/search/trending')
      if (res.ok) {
        const data = await res.json()
        setTrendingSearches(
          data.slice(0, 5).map((item: any) => ({
            text: item.query,
            type: 'trending' as const,
            count: item.search_count,
          }))
        )
      }
    } catch (error) {
      console.error('Failed to fetch trending searches:', error)
    }
  }

  const fetchSuggestions = async (query: string) => {
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return

    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10) // Keep only last 10

    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const removeRecentSearch = (query: string) => {
    const updated = recentSearches.filter(s => s !== query)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const handleSearch = (query: string) => {
    saveRecentSearch(query)
    onSearch(query)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    const allSuggestions = [
      ...suggestions,
      ...recentSearches.map(text => ({ text, type: 'recent' as const })),
      ...trendingSearches,
    ]

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < allSuggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
          const selected = allSuggestions[selectedIndex]
          onChange(selected.text)
          handleSearch(selected.text)
        } else {
          handleSearch(value)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const allSuggestions = [
    ...suggestions,
    ...(value.length < 2
      ? recentSearches.slice(0, 3).map(text => ({ text, type: 'recent' as const }))
      : []),
    ...(value.length < 2 ? trendingSearches : []),
  ]

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className={cn('pl-10 pr-10', className)}
        />
        {value && (
          <button
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && allSuggestions.length > 0 && (
        <Card
          ref={suggestionsRef}
          className="absolute top-full mt-2 w-full z-50 card-bg border-literary-border shadow-lg max-h-80 overflow-y-auto"
        >
          <div className="py-2">
            {value.length < 2 && recentSearches.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                  Recent Searches
                </div>
                {recentSearches.slice(0, 3).map((search, index) => (
                  <button
                    key={`recent-${index}`}
                    onClick={() => {
                      onChange(search)
                      handleSearch(search)
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between group',
                      selectedIndex === index + suggestions.length && 'bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{search}</span>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        removeRecentSearch(search)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </button>
                ))}
              </>
            )}

            {suggestions.length > 0 && (
              <>
                {value.length >= 2 && (
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                    Suggestions
                  </div>
                )}
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`suggestion-${index}`}
                    onClick={() => {
                      onChange(suggestion.text)
                      handleSearch(suggestion.text)
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between',
                      selectedIndex === index && 'bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{suggestion.text}</span>
                    </div>
                    {suggestion.count && (
                      <span className="text-xs text-muted-foreground">
                        {suggestion.count} searches
                      </span>
                    )}
                  </button>
                ))}
              </>
            )}

            {value.length < 2 && trendingSearches.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground mt-2">
                  Trending
                </div>
                {trendingSearches.map((trending, index) => (
                  <button
                    key={`trending-${index}`}
                    onClick={() => {
                      onChange(trending.text)
                      handleSearch(trending.text)
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between',
                      selectedIndex ===
                        index + suggestions.length + recentSearches.slice(0, 3).length && 'bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm">{trending.text}</span>
                    </div>
                    {trending.count && (
                      <span className="text-xs text-muted-foreground">
                        {trending.count} searches
                      </span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
