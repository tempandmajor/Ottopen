'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Slider } from '@/src/components/ui/slider'
import { Switch } from '@/src/components/ui/switch'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'

export interface SearchFilters {
  // General
  type?: 'authors' | 'works' | 'posts'
  sortBy?: 'relevance' | 'recent' | 'popular' | 'alphabetical'

  // Posts filters
  genre?: string
  contentType?: string
  published?: boolean
  minReadingTime?: number
  maxReadingTime?: number
  mood?: string

  // Authors filters
  accountType?: string
  verified?: boolean

  // Date filters
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year'
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  activeTab: 'authors' | 'works' | 'posts'
}

const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Poetry',
  'Drama',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Fantasy',
  'Horror',
  'Thriller',
  'Historical',
  'Biography',
  'Essay',
  'Other',
]

const CONTENT_TYPES = [
  'Short Story',
  'Novel',
  'Novella',
  'Flash Fiction',
  'Poem',
  'Essay',
  'Article',
  'Blog Post',
  'Review',
  'Other',
]

const MOODS = [
  'Inspired',
  'Reflective',
  'Celebratory',
  'Seeking Feedback',
  'Announcement',
  'Melancholic',
  'Humorous',
  'Serious',
]

const ACCOUNT_TYPES = ['reader', 'writer', 'editor', 'publisher', 'agent']

export function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  activeTab,
}: AdvancedSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  useEffect(() => {
    // Count active filters
    let count = 0
    if (filters.sortBy && filters.sortBy !== 'relevance') count++
    if (filters.genre) count++
    if (filters.contentType) count++
    if (filters.published !== undefined) count++
    if (filters.minReadingTime) count++
    if (filters.maxReadingTime) count++
    if (filters.mood) count++
    if (filters.accountType) count++
    if (filters.verified) count++
    if (filters.dateRange && filters.dateRange !== 'all') count++
    setActiveFiltersCount(count)
  }, [filters])

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      type: activeTab,
      sortBy: 'relevance',
    })
  }

  return (
    <Card className="card-bg border-literary-border">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Filter Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Filters</h3>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Always Visible - Sort By */}
          <div className="space-y-2">
            <Label className="text-sm">Sort By</Label>
            <Select
              value={filters.sortBy || 'relevance'}
              onValueChange={value => updateFilter('sortBy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Most Relevant</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expandable Filters */}
          {isExpanded && (
            <div className="space-y-4 pt-2 border-t border-literary-border">
              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label className="text-sm">Date Range</Label>
                <Select
                  value={filters.dateRange || 'all'}
                  onValueChange={value => updateFilter('dateRange', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Posts-specific filters */}
              {activeTab === 'posts' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm">Genre</Label>
                    <Select
                      value={filters.genre || 'all'}
                      onValueChange={value =>
                        updateFilter('genre', value === 'all' ? undefined : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All genres" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Genres</SelectItem>
                        {GENRES.map(genre => (
                          <SelectItem key={genre} value={genre.toLowerCase()}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Content Type</Label>
                    <Select
                      value={filters.contentType || 'all'}
                      onValueChange={value =>
                        updateFilter('contentType', value === 'all' ? undefined : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {CONTENT_TYPES.map(type => (
                          <SelectItem key={type} value={type.toLowerCase()}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Mood</Label>
                    <Select
                      value={filters.mood || 'all'}
                      onValueChange={value =>
                        updateFilter('mood', value === 'all' ? undefined : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All moods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Moods</SelectItem>
                        {MOODS.map(mood => (
                          <SelectItem key={mood} value={mood.toLowerCase()}>
                            {mood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm">Reading Time (minutes)</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Slider
                          value={[filters.minReadingTime || 0]}
                          onValueChange={value =>
                            updateFilter('minReadingTime', value[0] || undefined)
                          }
                          max={60}
                          step={5}
                          className="mt-2"
                        />
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {filters.minReadingTime || 0} min
                        </span>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Slider
                          value={[filters.maxReadingTime || 60]}
                          onValueChange={value =>
                            updateFilter('maxReadingTime', value[0] || undefined)
                          }
                          max={60}
                          step={5}
                          className="mt-2"
                        />
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {filters.maxReadingTime || 60} min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Published Only</Label>
                    <Switch
                      checked={filters.published || false}
                      onCheckedChange={checked => updateFilter('published', checked || undefined)}
                    />
                  </div>
                </>
              )}

              {/* Authors-specific filters */}
              {activeTab === 'authors' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm">Account Type</Label>
                    <Select
                      value={filters.accountType || 'all'}
                      onValueChange={value =>
                        updateFilter('accountType', value === 'all' ? undefined : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {ACCOUNT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Verified Only</Label>
                    <Switch
                      checked={filters.verified || false}
                      onCheckedChange={checked => updateFilter('verified', checked || undefined)}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
