'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, Clock, Lock } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card } from '@/src/components/ui/card'
import type { Script, ScriptType } from '@/src/types/script-editor'

interface ScriptListProps {
  scripts: Script[]
  onCreateScript: (data: { title: string; script_type: ScriptType }) => Promise<void>
}

export function ScriptList({ scripts, onCreateScript }: ScriptListProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newScript, setNewScript] = useState({
    title: '',
    script_type: 'screenplay' as ScriptType,
  })

  const handleCreate = async () => {
    if (newScript.title.trim()) {
      await onCreateScript(newScript)
      setNewScript({ title: '', script_type: 'screenplay' })
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Scripts</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Script
        </Button>
      </div>

      {isCreating && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Script</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={newScript.title}
                onChange={e => setNewScript({ ...newScript, title: e.target.value })}
                placeholder="My Awesome Screenplay"
                className="w-full border rounded px-3 py-2"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Script Type</label>
              <select
                value={newScript.script_type}
                onChange={e =>
                  setNewScript({ ...newScript, script_type: e.target.value as ScriptType })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="screenplay">Screenplay</option>
                <option value="tv_pilot">TV Pilot</option>
                <option value="stage_play">Stage Play</option>
                <option value="radio_drama">Radio Drama</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} className="flex-1">
                Create Script
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scripts.map(script => (
          <Link key={script.id} href={`/scripts/${script.id}`}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start justify-between mb-4">
                <FileText className="w-8 h-8 text-blue-500" />
                {script.is_locked && <Lock className="w-4 h-4 text-gray-400" />}
              </div>

              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{script.title}</h3>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span className="px-2 py-1 bg-gray-100 rounded capitalize">
                  {script.script_type.replace('_', ' ')}
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded">{script.page_count} pages</span>
              </div>

              {script.logline && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{script.logline}</p>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Updated {new Date(script.updated_at || '').toLocaleDateString()}</span>
              </div>

              <div className="mt-3 flex gap-1">
                {script.genre?.slice(0, 3).map(genre => (
                  <span key={genre} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                    {genre}
                  </span>
                ))}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {scripts.length === 0 && !isCreating && (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No scripts yet</h2>
          <p className="text-gray-600 mb-4">
            Create your first script to get started with professional screenwriting.
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Script
          </Button>
        </div>
      )}
    </div>
  )
}
