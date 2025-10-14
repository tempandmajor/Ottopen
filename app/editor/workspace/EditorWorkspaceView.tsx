'use client'

import { EditorTabs } from '@/src/components/editor-tabs/editor-tabs'
import { useEditorTabs } from '@/src/hooks/useEditorTabs'
import { ManuscriptNavigator } from '@/src/components/ai-editor/manuscript-navigator'
import { SaveStatus } from '@/src/components/editor-tabs/save-status'
import { EditorSkeleton } from '@/src/components/editor-tabs/editor-skeleton'
import { RichTextEditor } from '@/src/components/editor-tabs/rich-text-editor'
import { useAutoSave } from '@/src/hooks/useAutoSave'
import { useKeyboardShortcuts } from '@/src/hooks/useKeyboardShortcuts'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ChapterWithScenes } from '@/src/types/navigation'
import { Button } from '@/src/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip'
import { FileText, Plus } from 'lucide-react'

function ManuscriptWorkspaceContent() {
  const { tabs, activeTabId, activeTab, closeTab, switchTab, createNewTab, reorderTabs } =
    useEditorTabs({
      type: 'manuscript',
      basePath: '/editor/workspace',
      maxTabs: 10,
    })

  const [chapters, setChapters] = useState<ChapterWithScenes[]>([])
  const [manuscriptTitle, setManuscriptTitle] = useState('')
  const [totalWordCount, setTotalWordCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [contentChanged, setContentChanged] = useState(false)
  const [editorContent, setEditorContent] = useState('')
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'editor' | 'outline' | 'timeline'>('editor')
  const [dragScene, setDragScene] = useState<{ sceneId: string; fromChapterId: string } | null>(
    null
  )

  const moveScene = async (
    sceneId: string,
    fromChapterId: string,
    toChapterId: string,
    toIndex: number
  ) => {
    // Optimistic UI
    setChapters(prev => {
      const next = prev.map(ch => ({ ...ch, scenes: [...(ch.scenes || [])] }))
      const from = next.find(ch => ch.id === fromChapterId)
      const to = next.find(ch => ch.id === toChapterId)
      if (!from || !to) return prev
      const fromIdx = (from.scenes || []).findIndex(s => s.id === sceneId)
      if (fromIdx === -1) return prev
      const [scene] = (from.scenes as any[]).splice(fromIdx, 1)
      const clampedIndex = Math.max(0, Math.min(toIndex, (to.scenes || []).length))
      ;(to.scenes as any[]).splice(clampedIndex, 0, scene)
      return next
    })

    // Persist via API then refresh chapters
    try {
      if (!activeTab) return
      const resp = await fetch(`/api/manuscripts/${activeTab.fileId}/scenes/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene_id: sceneId,
          to_chapter_id: toChapterId || null,
          to_index: toIndex,
          from_chapter_id: fromChapterId || null,
        }),
      })
      if (!resp.ok) {
        console.warn('Failed to persist reorder')
      }
      // Reload chapters to reflect canonical order
      await loadManuscriptData(activeTab.fileId)
    } catch (e) {
      console.error('Reorder error', e)
    }
  }

  // Auto-save functionality
  const {
    isSaving,
    lastSaved,
    error: saveError,
  } = useAutoSave({
    onSave: async () => {
      if (!activeTab || !contentChanged) return
      if (!activeSceneId) return

      try {
        const wordCount = editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0
        const resp = await fetch(`/api/manuscripts/${activeTab.fileId}/scenes/${activeSceneId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editorContent, word_count: wordCount }),
        })
        if (!resp.ok) {
          return
        }
        setContentChanged(false)
      } catch (_) {
        return
      }
    },
    enabled: !!activeTab && contentChanged,
  })

  // Load manuscript data when active tab changes
  useEffect(() => {
    if (activeTab) {
      loadManuscriptData(activeTab.fileId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab?.fileId])

  // Warn before closing browser if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (contentChanged) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [contentChanged])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 's',
        metaKey: true,
        handler: e => {
          e.preventDefault()
          if (activeTab && contentChanged && !isSaving) {
            // Trigger manual save
            setContentChanged(false)
          }
        },
        description: 'Save current manuscript',
      },
      {
        key: 'w',
        metaKey: true,
        handler: e => {
          e.preventDefault()
          if (activeTab) {
            closeTab(activeTab.id)
          }
        },
        description: 'Close current tab',
      },
      {
        key: 't',
        metaKey: true,
        handler: e => {
          e.preventDefault()
          createNewTab()
        },
        description: 'Create new tab',
      },
    ],
    enabled: !!activeTab,
  })

  const loadManuscriptData = async (manuscriptId: string) => {
    try {
      setLoading(true)

      // Load manuscript details
      const manuscriptRes = await fetch(`/api/manuscripts/${manuscriptId}`)
      if (manuscriptRes.ok) {
        const { manuscript } = await manuscriptRes.json()
        setManuscriptTitle(manuscript.title)
        setTotalWordCount(manuscript.current_word_count || 0)
      }

      // Load chapters and scenes
      const chaptersRes = await fetch(`/api/manuscripts/${manuscriptId}/chapters`)
      if (chaptersRes.ok) {
        const { chapters: chaptersData } = await chaptersRes.json()
        setChapters(chaptersData || [])

        // If no chapters exist, optionally auto-create a default Chapter 1 and Scene 1
        const isNew = searchParams?.get('new') === 'true'
        if ((chaptersData || []).length === 0) {
          const createDefault = async () => {
            // Create Chapter 1
            const chRes = await fetch(`/api/manuscripts/${manuscriptId}/chapters`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: 'Chapter 1' }),
            })
            if (chRes.ok) {
              const { chapter } = await chRes.json()
              // Create Scene 1 in Chapter 1
              await fetch(`/api/manuscripts/${manuscriptId}/scenes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chapter_id: chapter.id, title: 'Scene 1', content: '' }),
              })
            }
            // Reload after creating defaults
            const reloadRes = await fetch(`/api/manuscripts/${manuscriptId}/chapters`)
            if (reloadRes.ok) {
              const { chapters: reloadChapters } = await reloadRes.json()
              setChapters(reloadChapters || [])
            }
          }
          // Auto-create on brand new open or when user has no chapters yet
          if (isNew || (chaptersData || []).length === 0) {
            await createDefault()
          }
        }

        const firstScene = (chaptersData?.[0]?.scenes || [])[0]
        if (firstScene && !activeSceneId) {
          setActiveSceneId(firstScene.id)
          setEditorContent(firstScene.content || '')
        }
      }
    } catch (error) {
      console.error('Failed to load manuscript data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChapterClick = (chapterId: string) => {
    console.log('Chapter clicked:', chapterId)
    // TODO: Scroll to chapter in editor
  }

  const handleSceneClick = (sceneId: string) => {
    setActiveSceneId(sceneId)
    const scene = chapters.flatMap(ch => ch.scenes || []).find(sc => sc.id === sceneId) as any
    setEditorContent((scene && scene.content) || '')
  }

  const handleAddChapter = async () => {
    if (!activeTab) return

    try {
      const response = await fetch(`/api/manuscripts/${activeTab.fileId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Chapter ${chapters.length + 1}`,
        }),
      })

      if (response.ok) {
        loadManuscriptData(activeTab.fileId)
      }
    } catch (error) {
      console.error('Failed to add chapter:', error)
    }
  }

  const handleAddScene = async (chapterId: string) => {
    if (!activeTab) return

    try {
      const response = await fetch(`/api/manuscripts/${activeTab.fileId}/scenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: chapterId,
          title: 'New Scene',
        }),
      })

      if (response.ok) {
        loadManuscriptData(activeTab.fileId)
      }
    } catch (error) {
      console.error('Failed to add scene:', error)
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!activeTab || !confirm('Delete this chapter?')) return

    try {
      const response = await fetch(`/api/manuscripts/${activeTab.fileId}/chapters/${chapterId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadManuscriptData(activeTab.fileId)
      }
    } catch (error) {
      console.error('Failed to delete chapter:', error)
    }
  }

  const handleDeleteScene = async (sceneId: string) => {
    if (!activeTab || !confirm('Delete this scene?')) return

    try {
      const response = await fetch(`/api/manuscripts/${activeTab.fileId}/scenes/${sceneId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadManuscriptData(activeTab.fileId)
      }
    } catch (error) {
      console.error('Failed to delete scene:', error)
    }
  }

  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No manuscripts open</h2>
          <p className="text-muted-foreground mb-6">
            Open a manuscript from your library or create a new one
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => (window.location.href = '/editor')} variant="outline">
              Browse Manuscripts
            </Button>
            <Button onClick={createNewTab}>
              <Plus className="mr-2 h-4 w-4" />
              New Manuscript
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Tab bar */}
      <EditorTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={switchTab}
        onTabClose={closeTab}
        onTabAdd={createNewTab}
        onTabReorder={reorderTabs}
      />

      {/* Save status bar with quick actions */}
      {activeTab && (
        <div className="border-b px-4 py-2 bg-muted/30 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4 min-w-0">
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-foreground truncate max-w-[28ch] cursor-default">
                      {manuscriptTitle || activeTab.title}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start">
                    <div className="max-w-[40ch] break-words">
                      {manuscriptTitle || activeTab.title}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="hidden sm:inline">•</span>
              <span className="truncate">
                {(() => {
                  const totalScenes = (chapters || []).reduce(
                    (acc, ch: any) => acc + (ch.scenes || []).length,
                    0
                  )
                  return `${totalScenes} scenes • ${totalWordCount} words`
                })()}
              </span>
            </div>
            <SaveStatus
              isSaving={isSaving}
              lastSaved={lastSaved}
              error={saveError}
              isDirty={contentChanged}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab) {
                  if (typeof window !== 'undefined') {
                    window.open(`/editor/${activeTab.fileId}`, '_blank', 'noopener,noreferrer')
                  }
                }
              }}
            >
              AI Assistant
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab) {
                  if (typeof window !== 'undefined') {
                    window.open(`/editor/${activeTab.fileId}`, '_blank', 'noopener,noreferrer')
                  }
                }
              }}
            >
              Story Bible
            </Button>
            <Button
              variant={viewMode === 'editor' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('editor')}
              title="Editor"
            >
              Editor
            </Button>
            <Button
              variant={viewMode === 'outline' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('outline')}
              title="Outline"
            >
              Outline
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              title="Timeline"
            >
              Timeline
            </Button>
          </div>
        </div>
      )}

      {/* Editor content */}
      {loading ? (
        <EditorSkeleton />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Navigator sidebar */}
          {activeTab && (
            <ManuscriptNavigator
              manuscriptId={activeTab.fileId}
              manuscriptTitle={manuscriptTitle || activeTab.title}
              chapters={chapters}
              totalWordCount={totalWordCount}
              onChapterClick={handleChapterClick}
              onSceneClick={handleSceneClick}
              onAddChapter={handleAddChapter}
              onAddScene={handleAddScene}
              onDeleteChapter={handleDeleteChapter}
              onDeleteScene={handleDeleteScene}
            />
          )}

          {/* Main content area */}
          <div className="flex-1 overflow-hidden bg-background">
            {viewMode === 'editor' && (
              <RichTextEditor
                content={editorContent}
                onChange={content => {
                  setEditorContent(content)
                  setContentChanged(true)
                }}
                placeholder={`Start writing your manuscript: ${manuscriptTitle}`}
                showWordCount={true}
                className="h-full"
              />
            )}

            {viewMode === 'outline' && (
              <div className="h-full overflow-auto p-6">
                <h2 className="text-xl font-semibold mb-2">Outline</h2>
                <div className="text-sm text-muted-foreground mb-4">
                  {(() => {
                    const allScenes = chapters.flatMap(ch => ch.scenes || [])
                    const totalScenes = allScenes.length
                    const totalWords = allScenes.reduce(
                      (acc, s: any) => acc + (s.word_count || 0),
                      0
                    )
                    return (
                      <span>
                        {totalScenes} scenes • {totalWords} words
                      </span>
                    )
                  })()}
                </div>
                <div className="space-y-4">
                  {chapters.map((ch, idx) => (
                    <div key={ch.id} className="border rounded-lg bg-white">
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div className="font-medium">{ch.title || `Chapter ${idx + 1}`}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          <span>{(ch.scenes || []).length} scenes</span>
                          <span>
                            {((ch.scenes || []) as any[]).reduce(
                              (acc, s) => acc + (s.word_count || 0),
                              0
                            )}{' '}
                            words
                          </span>
                        </div>
                      </div>
                      <div className="border-t divide-y">
                        {(ch.scenes || []).map((sc, sIdx) => (
                          <div
                            key={sc.id}
                            className="px-4 py-3 flex items-center justify-between gap-3"
                            draggable
                            onDragStart={() =>
                              setDragScene({ sceneId: sc.id, fromChapterId: ch.id })
                            }
                            onDragOver={e => {
                              e.preventDefault()
                            }}
                            onDrop={e => {
                              e.preventDefault()
                              if (dragScene) {
                                moveScene(dragScene.sceneId, dragScene.fromChapterId, ch.id, sIdx)
                                setDragScene(null)
                              }
                            }}
                          >
                            <div className="text-sm flex-1">
                              <span className="font-medium mr-2">
                                {sc.title || `Scene ${sIdx + 1}`}
                              </span>
                              <span className="text-muted-foreground">
                                {sc.content ? `${sc.content.slice(0, 80)}…` : 'No summary'}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mr-2 whitespace-nowrap">
                              {sc.word_count ? `${sc.word_count} words` : ''}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  const newTitle = prompt(
                                    'Rename scene title',
                                    sc.title || `Scene ${sIdx + 1}`
                                  )
                                  if (!newTitle || !activeTab) return
                                  try {
                                    await fetch(
                                      `/api/manuscripts/${activeTab.fileId}/scenes/${sc.id}`,
                                      {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ title: newTitle }),
                                      }
                                    )
                                    await loadManuscriptData(activeTab.fileId)
                                  } catch (e) {
                                    console.error('Rename failed', e)
                                  }
                                }}
                              >
                                Rename
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  if (!activeTab) return
                                  if (!confirm('Delete this scene?')) return
                                  try {
                                    await fetch(
                                      `/api/manuscripts/${activeTab.fileId}/scenes/${sc.id}`,
                                      {
                                        method: 'DELETE',
                                      }
                                    )
                                    await loadManuscriptData(activeTab.fileId)
                                  } catch (e) {
                                    console.error('Delete failed', e)
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                        {/* Drop zone at end of chapter */}
                        <div
                          className="px-4 py-2 text-xs text-muted-foreground"
                          onDragOver={e => {
                            e.preventDefault()
                          }}
                          onDrop={e => {
                            e.preventDefault()
                            if (dragScene) {
                              moveScene(
                                dragScene.sceneId,
                                dragScene.fromChapterId,
                                ch.id,
                                (ch.scenes || []).length
                              )
                              setDragScene(null)
                            }
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'timeline' && (
              <div className="h-full overflow-auto p-6">
                <h2 className="text-xl font-semibold mb-2">Timeline</h2>
                <div className="text-sm text-muted-foreground mb-4">
                  {(() => {
                    const allScenes = chapters.flatMap(ch => ch.scenes || [])
                    const totalScenes = allScenes.length
                    const totalWords = allScenes.reduce(
                      (acc, s: any) => acc + (s.word_count || 0),
                      0
                    )
                    return (
                      <span>
                        {totalScenes} scenes • {totalWords} words
                      </span>
                    )
                  })()}
                </div>
                <div className="relative">
                  <div className="absolute left-0 right-0 h-0.5 bg-gray-200 top-8" />
                  <div className="flex flex-wrap gap-4 relative">
                    {chapters.flatMap((ch, cIdx) =>
                      (ch.scenes || []).map((sc, sIdx) => (
                        <div key={sc.id} className="relative">
                          <div className="w-64 border rounded-lg bg-white shadow-sm p-3">
                            <div className="text-xs text-muted-foreground mb-1">
                              Ch {cIdx + 1} • Sc {sIdx + 1}
                            </div>
                            <div className="font-medium text-sm mb-1">
                              {sc.title || `Scene ${sIdx + 1}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {sc.content ? `${sc.content.slice(0, 100)}…` : 'No summary'}
                            </div>
                            {sc.word_count ? (
                              <div className="text-[10px] text-muted-foreground mt-2">
                                {sc.word_count} words
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function EditorWorkspaceView() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <ManuscriptWorkspaceContent />
    </Suspense>
  )
}
