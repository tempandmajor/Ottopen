'use client'

import { useState, useEffect } from 'react'
import { SceneVersion } from '@/src/types/ai-editor'
import { SceneService } from '@/src/lib/ai-editor-service'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Badge } from '@/src/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import { Clock, RotateCcw, Save, Eye, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'

interface VersionHistoryPanelProps {
  sceneId: string
  currentContent: string
  onRestore: (content: string) => void
  onClose: () => void
}

export function VersionHistoryPanel({
  sceneId,
  currentContent,
  onRestore,
  onClose,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<SceneVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [previewVersion, setPreviewVersion] = useState<SceneVersion | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [saveLabel, setSaveLabel] = useState('')
  const [isSavingVersion, setIsSavingVersion] = useState(false)

  useEffect(() => {
    loadVersions()
  }, [sceneId])

  const loadVersions = async () => {
    try {
      setLoading(true)
      const data = await SceneService.getVersions(sceneId)
      setVersions(data)
    } catch (error) {
      console.error('Failed to load versions:', error)
      toast.error('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCurrentVersion = async () => {
    if (!saveLabel.trim()) {
      toast.error('Please enter a label for this version')
      return
    }

    try {
      setIsSavingVersion(true)
      await SceneService.saveVersion(sceneId, saveLabel)
      setSaveLabel('')
      await loadVersions()
      toast.success('Version saved!')
    } catch (error) {
      console.error('Failed to save version:', error)
      toast.error('Failed to save version')
    } finally {
      setIsSavingVersion(false)
    }
  }

  const handlePreview = (version: SceneVersion) => {
    setPreviewVersion(version)
    setIsPreviewOpen(true)
  }

  const handleRestore = async (version: SceneVersion) => {
    if (!confirm('Restore this version? Your current work will be saved as a new version first.')) {
      return
    }

    try {
      // Save current state as a version before restoring
      await SceneService.saveVersion(sceneId, 'Auto-save before restore')

      // Restore the version
      await SceneService.restoreVersion(sceneId, version.id)

      // Update parent component
      onRestore(version.content)

      // Reload versions
      await loadVersions()

      toast.success('Version restored!')
    } catch (error) {
      console.error('Failed to restore version:', error)
      toast.error('Failed to restore version')
    }
  }

  const calculateWordCountDiff = (version: SceneVersion) => {
    const currentWords = currentContent.trim().split(/\s+/).filter(Boolean).length
    const diff = version.word_count - currentWords
    if (diff > 0) return `+${diff}`
    if (diff < 0) return diff.toString()
    return '0'
  }

  return (
    <div className="flex flex-col h-full border-l bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Version History</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Save Current Version */}
        <div className="flex gap-2">
          <Input
            placeholder="Version label (e.g., 'Draft 1', 'After edits')"
            value={saveLabel}
            onChange={e => setSaveLabel(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSaveCurrentVersion()
            }}
          />
          <Button
            onClick={handleSaveCurrentVersion}
            disabled={isSavingVersion || !saveLabel.trim()}
            size="sm"
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Version List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-muted-foreground">Loading versions...</div>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No saved versions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Save a version to create a snapshot of your work
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {versions.map(version => (
              <div
                key={version.id}
                className="p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {version.is_auto_save ? (
                        <Badge variant="secondary" className="text-xs">
                          Auto-save
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs">
                          Manual
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        v{version.version_number}
                      </span>
                    </div>
                    {version.label && <p className="font-medium text-sm">{version.label}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <span>
                    {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                  </span>
                  <span>{version.word_count.toLocaleString()} words</span>
                  <span
                    className={
                      calculateWordCountDiff(version).startsWith('+')
                        ? 'text-green-600'
                        : calculateWordCountDiff(version).startsWith('-')
                          ? 'text-red-600'
                          : ''
                    }
                  >
                    {calculateWordCountDiff(version)} from current
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(version)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(version)}
                    className="flex-1"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {previewVersion?.label || `Version ${previewVersion?.version_number}`}
            </DialogTitle>
            <DialogDescription>
              {previewVersion && (
                <span>
                  Saved{' '}
                  {formatDistanceToNow(new Date(previewVersion.created_at), { addSuffix: true })} •{' '}
                  {previewVersion.word_count.toLocaleString()} words
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 mt-4">
            <div
              className="prose prose-sm max-w-none p-4"
              dangerouslySetInnerHTML={{ __html: previewVersion?.content || '' }}
            />
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            {previewVersion && (
              <Button
                onClick={() => {
                  handleRestore(previewVersion)
                  setIsPreviewOpen(false)
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore This Version
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
