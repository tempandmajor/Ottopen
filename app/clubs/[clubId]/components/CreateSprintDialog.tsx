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
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Calendar } from '@/src/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { CalendarIcon, Loader2, Zap } from 'lucide-react'
import { format, addMinutes } from 'date-fns'
import { toast } from 'react-hot-toast'

interface CreateSprintDialogProps {
  clubId: string
  onSprintCreated?: () => void
}

const DURATION_OPTIONS = [
  { value: '15', label: '15 minutes - Quick Sprint' },
  { value: '30', label: '30 minutes - Standard' },
  { value: '45', label: '45 minutes - Extended' },
  { value: '60', label: '1 hour - Deep Focus' },
  { value: '90', label: '90 minutes - Marathon' },
]

export function CreateSprintDialog({ clubId, onSprintCreated }: CreateSprintDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('30')
  const [startDate, setStartDate] = useState<Date>()
  const [startTime, setStartTime] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [wordCountGoal, setWordCountGoal] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Please enter a sprint title')
      return
    }

    if (!startDate || !startTime) {
      toast.error('Please select start date and time')
      return
    }

    try {
      setLoading(true)

      // Combine date and time
      const [hours, minutes] = startTime.split(':')
      const startDateTime = new Date(startDate)
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      const response = await fetch(`/api/book-clubs/${clubId}/sprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          duration_minutes: parseInt(duration),
          start_time: startDateTime.toISOString(),
          max_participants: maxParticipants ? parseInt(maxParticipants) : undefined,
          word_count_goal: wordCountGoal ? parseInt(wordCountGoal) : undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to create sprint')

      const data = await response.json()

      toast.success('Sprint created successfully!')
      setOpen(false)
      resetForm()
      onSprintCreated?.()
    } catch (error: any) {
      console.error('Create sprint error:', error)
      toast.error(error.message || 'Failed to create sprint')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDuration('30')
    setStartDate(undefined)
    setStartTime('')
    setMaxParticipants('')
    setWordCountGoal('')
  }

  // Get suggested end time based on duration
  const getEndTime = () => {
    if (!startDate || !startTime || !duration) return ''
    const [hours, minutes] = startTime.split(':')
    const start = new Date(startDate)
    start.setHours(parseInt(hours), parseInt(minutes))
    const end = addMinutes(start, parseInt(duration))
    return format(end, 'h:mm a')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Zap className="mr-2 h-4 w-4" />
          Start a Sprint
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Writing Sprint</DialogTitle>
          <DialogDescription>
            Start a focused writing session with your club members
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Sprint Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Morning Writing Sprint"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What will we be working on?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={date => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Start Time *</Label>
              <Input
                id="time"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration *</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {startTime && (
              <p className="text-xs text-muted-foreground">Sprint will end at {getEndTime()}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants (Optional)</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="2"
                value={maxParticipants}
                onChange={e => setMaxParticipants(e.target.value)}
                placeholder="Unlimited"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wordGoal">Word Count Goal (Optional)</Label>
              <Input
                id="wordGoal"
                type="number"
                min="50"
                step="50"
                value={wordCountGoal}
                onChange={e => setWordCountGoal(e.target.value)}
                placeholder="e.g., 500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Sprint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
