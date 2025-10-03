'use client'

import { useState } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { ScriptBeat } from '@/src/types/script-editor'

interface BeatBoardProps {
  scriptId: string
  beats: ScriptBeat[]
  onAddBeat: (beat: Partial<ScriptBeat>) => Promise<void>
  onUpdateBeat: (beatId: string, updates: Partial<ScriptBeat>) => Promise<void>
  onDeleteBeat: (beatId: string) => Promise<void>
}

const BEAT_TYPES = [
  { value: 'opening_image', label: 'Opening Image', page: 1 },
  { value: 'theme_stated', label: 'Theme Stated', page: 5 },
  { value: 'setup', label: 'Setup', page: 1 },
  { value: 'catalyst', label: 'Catalyst', page: 12 },
  { value: 'debate', label: 'Debate', page: 12 },
  { value: 'break_into_two', label: 'Break Into Two', page: 25 },
  { value: 'b_story', label: 'B Story', page: 30 },
  { value: 'fun_and_games', label: 'Fun and Games', page: 30 },
  { value: 'midpoint', label: 'Midpoint', page: 55 },
  { value: 'bad_guys_close_in', label: 'Bad Guys Close In', page: 55 },
  { value: 'all_is_lost', label: 'All Is Lost', page: 75 },
  { value: 'dark_night', label: 'Dark Night of the Soul', page: 75 },
  { value: 'break_into_three', label: 'Break Into Three', page: 85 },
  { value: 'finale', label: 'Finale', page: 85 },
  { value: 'final_image', label: 'Final Image', page: 110 },
]

export function BeatBoard({
  scriptId,
  beats,
  onAddBeat,
  onUpdateBeat,
  onDeleteBeat,
}: BeatBoardProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newBeat, setNewBeat] = useState<Partial<ScriptBeat>>({
    title: '',
    beat_type: 'opening_image',
    description: '',
  })

  const handleAdd = async () => {
    if (newBeat.title) {
      await onAddBeat(newBeat)
      setNewBeat({ title: '', beat_type: 'opening_image', description: '' })
      setIsAdding(false)
    }
  }

  const toggleComplete = async (beat: ScriptBeat) => {
    await onUpdateBeat(beat.id, { completed: !beat.completed })
  }

  return (
    <div className="p-4 bg-gray-50 border-l w-80 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Beat Board</h2>
        <Button size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {isAdding && (
          <Card className="p-3 space-y-2">
            <select
              value={newBeat.beat_type || ''}
              onChange={e => setNewBeat({ ...newBeat, beat_type: e.target.value as any })}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              {BEAT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} (~p.{type.page})
                </option>
              ))}
            </select>

            <input
              type="text"
              value={newBeat.title || ''}
              onChange={e => setNewBeat({ ...newBeat, title: e.target.value })}
              placeholder="Beat title..."
              className="w-full border rounded px-2 py-1 text-sm"
            />

            <textarea
              value={newBeat.description || ''}
              onChange={e => setNewBeat({ ...newBeat, description: e.target.value })}
              placeholder="Description..."
              className="w-full border rounded px-2 py-1 text-sm resize-none"
              rows={2}
            />

            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} className="flex-1">
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAdding(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {beats
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          .map(beat => (
            <Card
              key={beat.id}
              className={`p-3 cursor-pointer transition-colors ${
                beat.completed ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleComplete(beat)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        beat.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}
                    >
                      {beat.completed && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <h3 className="font-medium text-sm">{beat.title}</h3>
                  </div>
                  {beat.beat_type && (
                    <p className="text-xs text-gray-500 mt-1 capitalize">
                      {beat.beat_type.replace(/_/g, ' ')}
                    </p>
                  )}
                  {beat.description && (
                    <p className="text-xs text-gray-600 mt-1">{beat.description}</p>
                  )}
                  {beat.page_reference && (
                    <p className="text-xs text-gray-500 mt-1">Page {beat.page_reference}</p>
                  )}
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onDeleteBeat(beat.id)
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
      </div>

      {beats.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500 text-center py-8">
          No beats yet. Click + to add your first story beat.
        </p>
      )}
    </div>
  )
}
