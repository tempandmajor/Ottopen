'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { Slider } from '@/src/components/ui/slider'
import { Calendar } from '@/src/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { CalendarIcon, InfoIcon } from 'lucide-react'
import { format } from 'date-fns'

interface CritiqueSubmissionFormProps {
  clubId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmissionCreated: () => void
  userCredits: number
}

export function CritiqueSubmissionForm({
  clubId,
  open,
  onOpenChange,
  onSubmissionCreated,
  userCredits,
}: CritiqueSubmissionFormProps) {
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [genre, setGenre] = useState('')
  const [creditCost, setCreditCost] = useState([2])
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wordCount = excerpt.trim().split(/\s+/).filter(Boolean).length
  const isValidWordCount = wordCount >= 1000 && wordCount <= 5000

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !excerpt.trim() || !isValidWordCount || !deadline) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/book-clubs/${clubId}/critiques/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          excerpt,
          genre,
          creditCost: creditCost[0],
          deadline: deadline.toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit for critique')
      }

      onSubmissionCreated()
      setTitle('')
      setExcerpt('')
      setGenre('')
      setCreditCost([2])
      setDeadline(undefined)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit for Critique</DialogTitle>
            <DialogDescription>Share your work with fellow writers for feedback</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Chapter title or scene name"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                placeholder="e.g., Fantasy, Mystery, Romance"
                value={genre}
                onChange={e => setGenre(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Manuscript Excerpt</Label>
              <Textarea
                id="excerpt"
                placeholder="Paste your manuscript excerpt here (1,000-5,000 words)..."
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                rows={12}
                className="resize-none font-mono text-sm"
              />
              <div className="flex items-center justify-between text-xs">
                <span
                  className={
                    wordCount < 1000 || wordCount > 5000 ? 'text-red-600' : 'text-green-600'
                  }
                >
                  {wordCount.toLocaleString()} words
                  {!isValidWordCount && ' (must be 1,000-5,000 words)'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Credit Cost</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                      <InfoIcon className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">How Credit Cost Works</h4>
                      <p className="text-xs text-muted-foreground">
                        Higher credit costs incentivize more detailed critiques. Writers earn
                        credits by providing critiques to others.
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• 1-2 credits: Basic feedback</li>
                        <li>• 3-4 credits: Detailed analysis</li>
                        <li>• 5 credits: Comprehensive critique</li>
                      </ul>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={creditCost}
                  onValueChange={setCreditCost}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-20 text-right">
                  {creditCost[0]} {creditCost[0] === 1 ? 'credit' : 'credits'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your balance: {userCredits} credits
                {userCredits < creditCost[0] && (
                  <span className="text-red-600 ml-1">(Insufficient credits)</span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Critique Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, 'PPP') : <span>Pick a deadline</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    disabled={date =>
                      date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !title.trim() ||
                !excerpt.trim() ||
                !isValidWordCount ||
                !deadline ||
                userCredits < creditCost[0] ||
                loading
              }
            >
              {loading ? 'Submitting...' : `Submit (${creditCost[0]} credits)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
