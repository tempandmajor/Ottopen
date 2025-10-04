'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Badge } from '@/src/components/ui/badge'
import { GitCompare, RotateCcw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { SceneVersion } from '@/src/types/ai-editor'

interface VersionDiffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentVersion: SceneVersion
  compareVersion: SceneVersion
  onRestore?: (version: SceneVersion) => void
}

interface DiffPart {
  type: 'added' | 'removed' | 'unchanged'
  text: string
}

/**
 * Simple diff algorithm
 * In production, you'd use a library like diff-match-patch
 */
function computeDiff(text1: string, text2: string): DiffPart[] {
  const words1 = text1.split(/\s+/)
  const words2 = text2.split(/\s+/)
  const parts: DiffPart[] = []

  // Simple word-by-word comparison
  // In production, use Myers diff algorithm or similar
  let i = 0
  let j = 0

  while (i < words1.length || j < words2.length) {
    if (i >= words1.length) {
      // Rest is added
      parts.push({ type: 'added', text: words2[j] + ' ' })
      j++
    } else if (j >= words2.length) {
      // Rest is removed
      parts.push({ type: 'removed', text: words1[i] + ' ' })
      i++
    } else if (words1[i] === words2[j]) {
      // Same
      parts.push({ type: 'unchanged', text: words1[i] + ' ' })
      i++
      j++
    } else {
      // Different - simplified logic
      if (words2.includes(words1[i])) {
        parts.push({ type: 'added', text: words2[j] + ' ' })
        j++
      } else {
        parts.push({ type: 'removed', text: words1[i] + ' ' })
        i++
      }
    }
  }

  return parts
}

export function VersionDiffDialog({
  open,
  onOpenChange,
  currentVersion,
  compareVersion,
  onRestore,
}: VersionDiffDialogProps) {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified')

  const diff = useMemo(() => {
    return computeDiff(currentVersion.content, compareVersion.content)
  }, [currentVersion, compareVersion])

  const stats = useMemo(() => {
    const added = diff.filter(d => d.type === 'added').length
    const removed = diff.filter(d => d.type === 'removed').length
    const unchanged = diff.filter(d => d.type === 'unchanged').length

    return { added, removed, unchanged, total: added + removed + unchanged }
  }, [diff])

  const wordCountDiff = compareVersion.word_count - currentVersion.word_count

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              <DialogTitle>Compare Versions</DialogTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'unified' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('unified')}
              >
                Unified
              </Button>
              <Button
                variant={viewMode === 'split' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('split')}
              >
                Split
              </Button>
            </div>
          </div>
          <DialogDescription>Comparing changes between two versions</DialogDescription>
        </DialogHeader>

        {/* Version Info */}
        <div className="grid grid-cols-2 gap-4 py-4 border-y">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Current</Badge>
              <span className="text-sm font-medium">v{currentVersion.version_number}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(currentVersion.created_at), { addSuffix: true })}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentVersion.word_count.toLocaleString()} words
            </p>
            {currentVersion.label && <p className="text-sm font-medium">{currentVersion.label}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Comparing to</Badge>
              <span className="text-sm font-medium">v{compareVersion.version_number}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(compareVersion.created_at), { addSuffix: true })}
            </p>
            <p className="text-xs text-muted-foreground">
              {compareVersion.word_count.toLocaleString()} words
              {wordCountDiff !== 0 && (
                <span className={`ml-2 ${wordCountDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({wordCountDiff > 0 ? '+' : ''}
                  {wordCountDiff})
                </span>
              )}
            </p>
            {compareVersion.label && <p className="text-sm font-medium">{compareVersion.label}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <Badge variant="outline" className="gap-1">
            <span className="text-green-600">+{stats.added}</span> added
          </Badge>
          <Badge variant="outline" className="gap-1">
            <span className="text-red-600">-{stats.removed}</span> removed
          </Badge>
          <Badge variant="outline" className="gap-1">
            <span className="text-muted-foreground">{stats.unchanged}</span> unchanged
          </Badge>
        </div>

        {/* Diff View */}
        <ScrollArea className="flex-1 rounded-md border">
          {viewMode === 'unified' ? (
            <div className="p-4 font-mono text-sm">
              {diff.map((part, idx) => (
                <span
                  key={idx}
                  className={
                    part.type === 'added'
                      ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100'
                      : part.type === 'removed'
                        ? 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100 line-through'
                        : ''
                  }
                >
                  {part.text}
                </span>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 divide-x">
              {/* Current Version */}
              <div className="p-4">
                <h4 className="text-sm font-medium mb-3 sticky top-0 bg-background pb-2 border-b">
                  Current (v{currentVersion.version_number})
                </h4>
                <div className="font-mono text-sm space-y-1">
                  {diff
                    .filter(d => d.type !== 'added')
                    .map((part, idx) => (
                      <div
                        key={idx}
                        className={
                          part.type === 'removed'
                            ? 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100'
                            : ''
                        }
                      >
                        {part.text}
                      </div>
                    ))}
                </div>
              </div>

              {/* Compare Version */}
              <div className="p-4">
                <h4 className="text-sm font-medium mb-3 sticky top-0 bg-background pb-2 border-b">
                  Comparing to (v{compareVersion.version_number})
                </h4>
                <div className="font-mono text-sm space-y-1">
                  {diff
                    .filter(d => d.type !== 'removed')
                    .map((part, idx) => (
                      <div
                        key={idx}
                        className={
                          part.type === 'added'
                            ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100'
                            : ''
                        }
                      >
                        {part.text}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onRestore && (
            <Button
              onClick={() => {
                onRestore(compareVersion)
                onOpenChange(false)
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore This Version
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
