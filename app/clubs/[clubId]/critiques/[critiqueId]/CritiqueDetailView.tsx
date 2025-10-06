'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Separator } from '@/src/components/ui/separator'
import { ArrowLeft, Clock, BookOpen, Star, ThumbsUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { CritiqueReviewForm } from '../../components/CritiqueReviewForm'

interface CritiqueDetailViewProps {
  clubId: string
  critiqueId: string
}

interface Review {
  id: string
  reviewer: {
    id: string
    name: string
    avatar_url?: string
  }
  ratings: {
    plot: number
    characters: number
    prose: number
    pacing: number
  }
  overall_feedback: string
  inline_comments?: string
  helpful_count: number
  created_at: string
}

interface Critique {
  id: string
  title: string
  genre: string
  excerpt: string
  credit_cost: number
  deadline: string
  status: string
  word_count: number
  author: {
    id: string
    name: string
    avatar_url?: string
  }
  reviews: Review[]
  created_at: string
}

export function CritiqueDetailView({ clubId, critiqueId }: CritiqueDetailViewProps) {
  const router = useRouter()
  const [critique, setCritique] = useState<Critique | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    loadCritique()
    loadUser()
  }, [critiqueId])

  const loadUser = async () => {
    try {
      const response = await fetch('/api/auth/user')
      const data = await response.json()
      setUserId(data.user?.id || '')
    } catch (error) {
      console.error('Failed to load user:', error)
    }
  }

  const loadCritique = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/book-clubs/${clubId}/critiques/${critiqueId}`)
      const data = await response.json()
      setCritique(data.critique)
    } catch (error) {
      console.error('Failed to load critique:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkHelpful = async (reviewId: string) => {
    // TODO: Implement helpful marking
    console.log('Mark helpful:', reviewId)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 animate-pulse">
        <div className="container mx-auto max-w-5xl">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!critique) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto max-w-5xl">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-2">Critique not found</h3>
              <Button onClick={() => router.back()}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isAuthor = critique.author.id === userId
  const hasReviewed = critique.reviews.some(r => r.reviewer.id === userId)
  const canReview = !isAuthor && !hasReviewed

  const averageRatings =
    critique.reviews.length > 0
      ? {
          plot:
            critique.reviews.reduce((sum, r) => sum + r.ratings.plot, 0) / critique.reviews.length,
          characters:
            critique.reviews.reduce((sum, r) => sum + r.ratings.characters, 0) /
            critique.reviews.length,
          prose:
            critique.reviews.reduce((sum, r) => sum + r.ratings.prose, 0) / critique.reviews.length,
          pacing:
            critique.reviews.reduce((sum, r) => sum + r.ratings.pacing, 0) /
            critique.reviews.length,
        }
      : null

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-5xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Critiques
        </Button>

        {showReviewForm ? (
          <CritiqueReviewForm
            critiqueId={critiqueId}
            clubId={clubId}
            excerpt={critique.excerpt}
            onReviewSubmitted={() => {
              setShowReviewForm(false)
              loadCritique()
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={critique.status === 'open' ? 'default' : 'secondary'}>
                        {critique.status}
                      </Badge>
                      {critique.genre && <Badge variant="outline">{critique.genre}</Badge>}
                    </div>
                    <CardTitle className="text-3xl mb-2">{critique.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{critique.author.name[0]}</AvatarFallback>
                        </Avatar>
                        by {critique.author.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(critique.created_at), { addSuffix: true })}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">{critique.credit_cost}</div>
                    <div className="text-sm text-muted-foreground">credits</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {critique.word_count.toLocaleString()} words
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Due {formatDistanceToNow(new Date(critique.deadline), { addSuffix: true })}
                  </span>
                  <span>
                    {critique.reviews.length} {critique.reviews.length === 1 ? 'review' : 'reviews'}
                  </span>
                </div>

                {canReview && (
                  <Button onClick={() => setShowReviewForm(true)} size="lg" className="w-full">
                    Give Critique (Earn 1 Credit)
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Excerpt */}
            <Card>
              <CardHeader>
                <CardTitle>Manuscript Excerpt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {critique.excerpt}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Average Ratings */}
            {averageRatings && (
              <Card>
                <CardHeader>
                  <CardTitle>Average Ratings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="font-semibold mb-1">Plot</div>
                      {renderStars(Math.round(averageRatings.plot))}
                      <div className="text-sm text-muted-foreground mt-1">
                        {averageRatings.plot.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold mb-1">Characters</div>
                      {renderStars(Math.round(averageRatings.characters))}
                      <div className="text-sm text-muted-foreground mt-1">
                        {averageRatings.characters.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold mb-1">Prose</div>
                      {renderStars(Math.round(averageRatings.prose))}
                      <div className="text-sm text-muted-foreground mt-1">
                        {averageRatings.prose.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold mb-1">Pacing</div>
                      {renderStars(Math.round(averageRatings.pacing))}
                      <div className="text-sm text-muted-foreground mt-1">
                        {averageRatings.pacing.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Critiques ({critique.reviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {critique.reviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No critiques yet. Be the first to provide feedback!
                  </div>
                ) : (
                  <div className="space-y-6">
                    {critique.reviews.map((review, index) => (
                      <div key={review.id}>
                        {index > 0 && <Separator className="my-6" />}
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{review.reviewer.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{review.reviewer.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(review.created_at), {
                                    addSuffix: true,
                                  })}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkHelpful(review.id)}
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              {review.helpful_count || 0}
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(review.ratings).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <div className="font-medium capitalize mb-1">{key}</div>
                                {renderStars(value)}
                              </div>
                            ))}
                          </div>

                          {review.inline_comments && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <div className="font-medium text-sm mb-2">Inline Comments</div>
                              <p className="text-sm whitespace-pre-wrap">
                                {review.inline_comments}
                              </p>
                            </div>
                          )}

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="font-medium text-sm mb-2">Overall Feedback</div>
                            <p className="text-sm whitespace-pre-wrap">{review.overall_feedback}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
