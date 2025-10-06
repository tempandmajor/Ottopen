'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { Slider } from '@/src/components/ui/slider'
import { Star } from 'lucide-react'

interface CritiqueReviewFormProps {
  critiqueId: string
  clubId: string
  excerpt: string
  onReviewSubmitted: () => void
}

interface Rating {
  plot: number
  characters: number
  prose: number
  pacing: number
}

export function CritiqueReviewForm({
  critiqueId,
  clubId,
  excerpt,
  onReviewSubmitted,
}: CritiqueReviewFormProps) {
  const [ratings, setRatings] = useState<Rating>({
    plot: 3,
    characters: 3,
    prose: 3,
    pacing: 3,
  })
  const [overallFeedback, setOverallFeedback] = useState('')
  const [inlineComments, setInlineComments] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRatingChange = (category: keyof Rating, value: number[]) => {
    setRatings(prev => ({ ...prev, [category]: value[0] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!overallFeedback.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/book-clubs/${clubId}/critiques/${critiqueId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ratings,
          overallFeedback,
          inlineComments,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit critique')
      }

      onReviewSubmitted()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
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

  const ratingCategories: { key: keyof Rating; label: string; description: string }[] = [
    { key: 'plot', label: 'Plot & Structure', description: 'Story progression and narrative arc' },
    {
      key: 'characters',
      label: 'Characters',
      description: 'Character development and authenticity',
    },
    { key: 'prose', label: 'Prose & Style', description: 'Writing quality and voice' },
    { key: 'pacing', label: 'Pacing', description: 'Story rhythm and flow' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manuscript Excerpt</CardTitle>
          <CardDescription>Review the excerpt before providing your critique</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            <p className="whitespace-pre-wrap font-mono text-sm">{excerpt}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rating Categories</CardTitle>
          <CardDescription>Rate each aspect from 1 (needs work) to 5 (excellent)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {ratingCategories.map(({ key, label, description }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">{label}</Label>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                {renderStars(ratings[key])}
              </div>
              <Slider
                value={[ratings[key]]}
                onValueChange={value => handleRatingChange(key, value)}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inline Comments</CardTitle>
          <CardDescription>
            Provide specific feedback on particular passages (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Example: 'Line 15-20: The dialogue here feels a bit forced. Consider...' or 'Paragraph 3: Great character moment, really showing not telling here.'"
            value={inlineComments}
            onChange={e => setInlineComments(e.target.value)}
            rows={6}
            className="resize-none"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overall Feedback</CardTitle>
          <CardDescription>
            Share your thoughts on strengths, areas for improvement, and suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What works well? What could be improved? What suggestions do you have for the author?"
            value={overallFeedback}
            onChange={e => setOverallFeedback(e.target.value)}
            rows={8}
            className="resize-none"
            required
          />
          <p className="text-xs text-muted-foreground mt-2">
            Be constructive and specific. Good critiques earn you credits and reputation!
          </p>
        </CardContent>
      </Card>

      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={!overallFeedback.trim() || loading}>
          {loading ? 'Submitting...' : 'Submit Critique'}
        </Button>
      </div>
    </form>
  )
}
