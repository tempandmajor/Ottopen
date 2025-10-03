'use client'

import { Save, Lock, Unlock, Download, Users, ListTree } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import type { Script } from '@/src/types/script-editor'

interface ScriptToolbarProps {
  script: Script
  onSave: () => void
  onToggleLock: () => void
  onExportPDF: () => void
  onShowCollaborators: () => void
  onShowBeatBoard: () => void
  isSaving?: boolean
}

export function ScriptToolbar({
  script,
  onSave,
  onToggleLock,
  onExportPDF,
  onShowCollaborators,
  onShowBeatBoard,
  isSaving = false,
}: ScriptToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-2 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">{script.title}</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="px-2 py-1 bg-gray-100 rounded capitalize">
            {script.script_type.replace('_', ' ')}
          </span>
          <span className="px-2 py-1 bg-gray-100 rounded">Page {script.page_count}</span>
          <span
            className="px-2 py-1 rounded capitalize"
            style={{
              backgroundColor: getRevisionColor(script.revision_color),
            }}
          >
            {script.revision_color} Rev. {script.revision_number}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onShowBeatBoard} title="Beat Board">
          <ListTree className="w-4 h-4 mr-2" />
          Beat Board
        </Button>

        <Button variant="ghost" size="sm" onClick={onShowCollaborators} title="Collaborators">
          <Users className="w-4 h-4 mr-2" />
          Share
        </Button>

        <Button variant="ghost" size="sm" onClick={onExportPDF} title="Export to PDF">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleLock}
          title={script.is_locked ? 'Unlock script' : 'Lock script'}
        >
          {script.is_locked ? (
            <Lock className="w-4 h-4 mr-2" />
          ) : (
            <Unlock className="w-4 h-4 mr-2" />
          )}
          {script.is_locked ? 'Locked' : 'Unlocked'}
        </Button>

        <Button size="sm" onClick={onSave} disabled={isSaving || script.is_locked}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

function getRevisionColor(color: string): string {
  const colors: Record<string, string> = {
    white: '#ffffff',
    blue: '#3b82f6',
    pink: '#ec4899',
    yellow: '#eab308',
    green: '#22c55e',
    goldenrod: '#daa520',
    buff: '#f0dc82',
    salmon: '#fa8072',
    cherry: '#de3163',
  }
  return colors[color] || colors.white
}
