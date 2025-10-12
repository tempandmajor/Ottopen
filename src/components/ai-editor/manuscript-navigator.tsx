'use client'

import { useState } from 'react'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Button } from '@/src/components/ui/button'
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Plus,
  FileText,
  MoreVertical,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import Link from 'next/link'
import type { ChapterWithScenes } from '@/src/types/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'

interface ManuscriptNavigatorProps {
  manuscriptId: string
  manuscriptTitle: string
  chapters: ChapterWithScenes[]
  activeChapterId?: string | null
  activeSceneId?: string | null
  totalWordCount?: number
  onChapterClick: (chapterId: string) => void
  onSceneClick: (sceneId: string) => void
  onAddChapter?: () => void
  onAddScene?: (chapterId: string) => void
  onDeleteChapter?: (chapterId: string) => void
  onDeleteScene?: (sceneId: string) => void
}

export function ManuscriptNavigator({
  manuscriptId,
  manuscriptTitle,
  chapters,
  activeChapterId,
  activeSceneId,
  totalWordCount = 0,
  onChapterClick,
  onSceneClick,
  onAddChapter,
  onAddScene,
  onDeleteChapter,
  onDeleteScene,
}: ManuscriptNavigatorProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(chapters.map(ch => ch.id))
  )

  const toggleChapterExpansion = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapterId)) {
        next.delete(chapterId)
      } else {
        next.add(chapterId)
      }
      return next
    })
  }

  const formatWordCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>

        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-semibold truncate">{manuscriptTitle}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatWordCount(totalWordCount)} words • {chapters.length}{' '}
          {chapters.length === 1 ? 'chapter' : 'chapters'}
        </p>
      </div>

      {/* Navigator Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {chapters.map((chapter, index) => {
            const isExpanded = expandedChapters.has(chapter.id)
            const isActiveChapter = chapter.id === activeChapterId

            return (
              <div key={chapter.id} className="mb-1">
                {/* Chapter Header */}
                <div className="group flex items-center gap-1">
                  <button
                    onClick={() => toggleChapterExpansion(chapter.id)}
                    className="flex-shrink-0 p-1 hover:bg-accent rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    onClick={() => onChapterClick(chapter.id)}
                    className={cn(
                      'flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      isActiveChapter
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-accent'
                    )}
                  >
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{chapter.title}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatWordCount(chapter.word_count)}
                    </span>
                  </button>

                  {onDeleteChapter && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onAddScene && (
                          <DropdownMenuItem onClick={() => onAddScene(chapter.id)}>
                            Add Scene
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onDeleteChapter(chapter.id)}
                          className="text-destructive"
                        >
                          Delete Chapter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Scenes List */}
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {chapter.scenes.length === 0 ? (
                      <div className="px-2 py-2 text-xs text-muted-foreground italic">
                        No scenes yet
                      </div>
                    ) : (
                      chapter.scenes.map(scene => {
                        const isActiveScene = scene.id === activeSceneId

                        return (
                          <div key={scene.id} className="group flex items-center gap-1">
                            <button
                              onClick={() => onSceneClick(scene.id)}
                              className={cn(
                                'flex flex-1 items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                                isActiveScene
                                  ? 'bg-secondary font-medium'
                                  : 'hover:bg-accent'
                              )}
                            >
                              <span className="text-xs mt-0.5 flex-shrink-0">•</span>
                              <span className="flex-1 truncate text-xs">
                                {scene.title || `Scene ${scene.order_index + 1}`}
                              </span>
                              {scene.word_count > 0 && (
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {formatWordCount(scene.word_count)}
                                </span>
                              )}
                            </button>

                            {onDeleteScene && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => onDeleteScene(scene.id)}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {chapters.length === 0 && (
            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Start writing your manuscript</p>
              <p className="text-xs mt-1">Chapters will appear here</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="border-t p-2 space-y-1">
        {onAddChapter && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={onAddChapter}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Chapter
          </Button>
        )}
      </div>
    </div>
  )
}
