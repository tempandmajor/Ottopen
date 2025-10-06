'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { BookOpen, Clock, Users, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Critique {
  id: string
  title: string
  genre: string
  excerpt: string
  credit_cost: number
  deadline: string
  status: 'open' | 'in_progress' | 'completed'
  critique_count: number
  word_count: number
  author: {
    id: string
    name: string
  }
  created_at: string
}

interface CritiqueListProps {
  clubId: string
  userId: string
}

export function CritiqueList({ clubId, userId }: CritiqueListProps) {
  const [critiques, setCritiques] = useState<Critique[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'recent' | 'deadline' | 'credits'>('recent')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>(
    'open'
  )

  useEffect(() => {
    loadCritiques()
  }, [clubId, sortBy, statusFilter])

  const loadCritiques = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        sortBy,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })
      const response = await fetch(`/api/book-clubs/${clubId}/critiques?${params}`)
      const data = await response.json()
      setCritiques(data.critiques || [])
    } catch (error) {
      console.error('Failed to load critiques:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: Critique['status']) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: Critique['status']) => {
    switch (status) {
      case 'open':
        return 'Open'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
    }
  }

  const isDeadlineSoon = (deadline: string) => {
    const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 3 && daysUntil > 0
  }

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={v => setStatusFilter(v as any)}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="deadline">Urgent Deadline</SelectItem>
            <SelectItem value="credits">Highest Credits</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {critiques.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-gray-600 mb-4">Be the first to submit your work for critique</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {critiques.map(critique => (
            <Card key={critique.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(critique.status)}>
                        {getStatusLabel(critique.status)}
                      </Badge>
                      {critique.genre && <Badge variant="outline">{critique.genre}</Badge>}
                      {isDeadlineSoon(critique.deadline) &&
                        !isDeadlinePassed(critique.deadline) && (
                          <Badge variant="destructive" className="animate-pulse">
                            <Clock className="h-3 w-3 mr-1" />
                            Urgent
                          </Badge>
                        )}
                    </div>
                    <CardTitle className="text-xl mb-1">{critique.title}</CardTitle>
                    <CardDescription>
                      by {critique.author.id === userId ? 'You' : critique.author.name} •{' '}
                      {formatDistanceToNow(new Date(critique.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{critique.credit_cost}</div>
                    <div className="text-xs text-muted-foreground">
                      {critique.credit_cost === 1 ? 'credit' : 'credits'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 line-clamp-3 mb-4">
                  {critique.excerpt.substring(0, 200)}...
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {critique.word_count.toLocaleString()} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {critique.critique_count}{' '}
                      {critique.critique_count === 1 ? 'critique' : 'critiques'}
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        isDeadlinePassed(critique.deadline) ? 'text-red-600' : ''
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      {isDeadlinePassed(critique.deadline)
                        ? 'Deadline passed'
                        : `Due ${formatDistanceToNow(new Date(critique.deadline), { addSuffix: true })}`}
                    </span>
                  </div>
                  <Link href={`/clubs/${clubId}/critiques/${critique.id}`}>
                    <Button
                      size="sm"
                      variant={critique.author.id === userId ? 'outline' : 'default'}
                    >
                      {critique.author.id === userId ? 'View Critiques' : 'Give Critique'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
