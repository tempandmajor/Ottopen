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
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Badge } from '@/src/components/ui/badge'
import { X } from 'lucide-react'
import { BookClub, ClubType } from '@/src/lib/book-club-service'

interface CreateClubDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClubCreated: (club: BookClub) => void
}

const GENRE_OPTIONS = [
  'Fantasy',
  'Sci-Fi',
  'Romance',
  'Thriller',
  'Mystery',
  'Horror',
  'Literary Fiction',
  'Young Adult',
  'Historical',
  'Contemporary',
  'Dystopian',
  'Paranormal',
]

export function CreateClubDialog({ open, onOpenChange, onClubCreated }: CreateClubDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    club_type: 'public' as ClubType,
    genre: [] as string[],
    tags: [] as string[],
    rules: '',
    welcome_message: '',
  })
  const [tagInput, setTagInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/book-clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to create club')

      const data = await response.json()
      onClubCreated(data.club)

      // Reset form
      setFormData({
        name: '',
        description: '',
        club_type: 'public',
        genre: [],
        tags: [],
        rules: '',
        welcome_message: '',
      })
    } catch (error) {
      console.error('Failed to create club:', error)
      alert('Failed to create club. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addGenre = (genre: string) => {
    if (!formData.genre.includes(genre)) {
      setFormData({ ...formData, genre: [...formData.genre, genre] })
    }
  }

  const removeGenre = (genre: string) => {
    setFormData({ ...formData, genre: formData.genre.filter(g => g !== genre) })
  }

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Book Club</DialogTitle>
          <DialogDescription>
            Start a community for writers to connect, share work, and grow together
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Club Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Fantasy Writers Unite"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell potential members what your club is about..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="club_type">Club Type</Label>
            <Select
              value={formData.club_type}
              onValueChange={(value: ClubType) => setFormData({ ...formData, club_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can join</SelectItem>
                <SelectItem value="private">Private - Request to join</SelectItem>
                <SelectItem value="invite-only">Invite Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Genres</Label>
            <Select onValueChange={addGenre}>
              <SelectTrigger>
                <SelectValue placeholder="Add genres..." />
              </SelectTrigger>
              <SelectContent>
                {GENRE_OPTIONS.map(genre => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.genre.map(genre => (
                <Badge key={genre} variant="secondary">
                  {genre}
                  <button
                    type="button"
                    onClick={() => removeGenre(genre)}
                    className="ml-1 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="outline">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="rules">Club Rules (optional)</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={e => setFormData({ ...formData, rules: e.target.value })}
              placeholder="Set guidelines for your club members..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="welcome_message">Welcome Message (optional)</Label>
            <Textarea
              id="welcome_message"
              value={formData.welcome_message}
              onChange={e => setFormData({ ...formData, welcome_message: e.target.value })}
              placeholder="Greet new members when they join..."
              rows={3}
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Club'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
