'use client'

import { useState, useEffect } from 'react'
import { Chapter, Scene } from '@/src/types/ai-editor'
import { ChapterService, SceneService } from '@/src/lib/ai-editor-service'
import {
  FileText,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { Input } from '@/src/components/ui/input'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { cn } from '@/src/lib/utils'
import { logger } from '@/src/lib/editor-logger'

interface ChapterSidebarProps {
  manuscriptId: string
  currentSceneId?: string
  onSceneSelect: (scene: Scene) => void
}

interface ChapterWithScenes extends Chapter {
  scenes: Scene[]
  isExpanded: boolean
}

export function ChapterSidebar({
  manuscriptId,
  currentSceneId,
  onSceneSelect,
}: ChapterSidebarProps) {
  const [chapters, setChapters] = useState<ChapterWithScenes[]>([])
  const [loading, setLoading] = useState(true)
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    loadChapters()
  }, [manuscriptId])

  const loadChapters = async () => {
    try {
      setLoading(true)
      const data = await ChapterService.getByManuscriptId(manuscriptId)
      const chaptersWithScenes = await Promise.all(
        data.map(async chapter => {
          const scenes = await SceneService.getByChapterId(chapter.id)
          return {
            ...chapter,
            scenes,
            isExpanded: true,
          }
        })
      )
      setChapters(chaptersWithScenes)
    } catch (error) {
      logger.error('Failed to load chapters', error as Error, { manuscriptId })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChapter = async () => {
    try {
      const newChapter = await ChapterService.create(manuscriptId, {
        title: `Chapter ${chapters.length + 1}`,
        order_index: chapters.length,
      })
      setChapters([
        ...chapters,
        {
          ...newChapter,
          scenes: [],
          isExpanded: true,
        },
      ])
    } catch (error) {
      logger.error('Failed to create chapter', error as Error, { manuscriptId })
    }
  }

  const handleCreateScene = async (chapterId: string) => {
    try {
      const chapter = chapters.find(c => c.id === chapterId)
      if (!chapter) return

      const newScene = await SceneService.create(chapterId, {
        title: `Scene ${chapter.scenes.length + 1}`,
        content: '',
        order_index: chapter.scenes.length,
      })

      setChapters(
        chapters.map(c =>
          c.id === chapterId
            ? {
                ...c,
                scenes: [...c.scenes, newScene],
              }
            : c
        )
      )

      onSceneSelect(newScene)
    } catch (error) {
      logger.error('Failed to create scene', error as Error, { chapterId })
    }
  }

  const handleRenameChapter = async (chapterId: string) => {
    try {
      await ChapterService.update(chapterId, { title: editTitle })
      setChapters(
        chapters.map(c =>
          c.id === chapterId
            ? {
                ...c,
                title: editTitle,
              }
            : c
        )
      )
      setEditingChapterId(null)
      setEditTitle('')
    } catch (error) {
      logger.error('Failed to rename chapter', error as Error, { chapterId, newTitle: editTitle })
    }
  }

  const handleRenameScene = async (sceneId: string) => {
    try {
      await SceneService.update(sceneId, { title: editTitle })
      setChapters(
        chapters.map(c => ({
          ...c,
          scenes: c.scenes.map(s =>
            s.id === sceneId
              ? {
                  ...s,
                  title: editTitle,
                }
              : s
          ),
        }))
      )
      setEditingSceneId(null)
      setEditTitle('')
    } catch (error) {
      logger.error('Failed to rename scene', error as Error, { sceneId, newTitle: editTitle })
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Delete this chapter and all its scenes?')) return

    try {
      await ChapterService.delete(chapterId)
      setChapters(chapters.filter(c => c.id !== chapterId))
    } catch (error) {
      logger.error('Failed to delete chapter', error as Error, { chapterId })
    }
  }

  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm('Delete this scene?')) return

    try {
      await SceneService.delete(sceneId)
      setChapters(
        chapters.map(c => ({
          ...c,
          scenes: c.scenes.filter(s => s.id !== sceneId),
        }))
      )
    } catch (error) {
      logger.error('Failed to delete scene', error as Error, { sceneId })
    }
  }

  const toggleChapterExpanded = (chapterId: string) => {
    setChapters(
      chapters.map(c =>
        c.id === chapterId
          ? {
              ...c,
              isExpanded: !c.isExpanded,
            }
          : c
      )
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading chapters...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full border-r bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Chapters</h2>
          <Button size="sm" variant="ghost" onClick={handleCreateChapter}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chapter List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {chapters.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <p>No chapters yet</p>
              <Button variant="link" onClick={handleCreateChapter} className="mt-2">
                Create your first chapter
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {chapters.map(chapter => (
                <div key={chapter.id} className="space-y-1">
                  {/* Chapter Item */}
                  <div
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent group',
                      !chapter.isExpanded && 'bg-muted/50'
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleChapterExpanded(chapter.id)}
                    >
                      {chapter.isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />

                    {editingChapterId === chapter.id ? (
                      <Input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onBlur={() => handleRenameChapter(chapter.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRenameChapter(chapter.id)
                          if (e.key === 'Escape') {
                            setEditingChapterId(null)
                            setEditTitle('')
                          }
                        }}
                        className="h-6 px-2 py-0 text-sm"
                        autoFocus
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm font-medium">{chapter.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {chapter.word_count?.toLocaleString() || 0} words
                        </span>
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCreateScene(chapter.id)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Scene
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingChapterId(chapter.id)
                            setEditTitle(chapter.title)
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Scene List */}
                  {chapter.isExpanded && (
                    <div className="ml-6 space-y-1">
                      {chapter.scenes.length === 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCreateScene(chapter.id)}
                          className="w-full justify-start text-muted-foreground h-8"
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          Add scene
                        </Button>
                      ) : (
                        chapter.scenes.map(scene => (
                          <div
                            key={scene.id}
                            className={cn(
                              'flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent group cursor-pointer',
                              currentSceneId === scene.id && 'bg-accent'
                            )}
                            onClick={() => onSceneSelect(scene)}
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                            <FileText className="h-3 w-3 text-muted-foreground" />

                            {editingSceneId === scene.id ? (
                              <Input
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                onBlur={() => handleRenameScene(scene.id)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRenameScene(scene.id)
                                  if (e.key === 'Escape') {
                                    setEditingSceneId(null)
                                    setEditTitle('')
                                  }
                                }}
                                className="h-6 px-2 py-0 text-xs"
                                autoFocus
                                onClick={e => e.stopPropagation()}
                              />
                            ) : (
                              <div className="flex-1 flex items-center justify-between">
                                <span className="text-xs">{scene.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {scene.word_count?.toLocaleString() || 0}
                                </span>
                              </div>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={e => {
                                    e.stopPropagation()
                                    setEditingSceneId(scene.id)
                                    setEditTitle(scene.title || '')
                                  }}
                                >
                                  <Edit2 className="mr-2 h-3 w-3" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={e => {
                                    e.stopPropagation()
                                    handleDeleteScene(scene.id)
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-3 w-3" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
