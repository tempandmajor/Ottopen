'use client'

import { EditorTabs } from '@/src/components/editor-tabs/editor-tabs'
import { useEditorTabs } from '@/src/hooks/useEditorTabs'
import { ManuscriptNavigator } from '@/src/components/ai-editor/manuscript-navigator'
import { SaveStatus } from '@/src/components/editor-tabs/save-status'
import { useAutoSave } from '@/src/hooks/useAutoSave'
import { useEffect, useState } from 'react'
import type { ChapterWithScenes } from '@/src/types/navigation'
import { Button } from '@/src/components/ui/button'
import { FileText, Plus } from 'lucide-react'

export default function ManuscriptWorkspacePage() {
  const { tabs, activeTabId, activeTab, closeTab, switchTab, createNewTab } = useEditorTabs({
    type: 'manuscript',
    basePath: '/editor/workspace',
    maxTabs: 10,
  })

  const [chapters, setChapters] = useState<ChapterWithScenes[]>([])
  const [manuscriptTitle, setManuscriptTitle] = useState('')
  const [totalWordCount, setTotalWordCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [contentChanged, setContentChanged] = useState(false)

  // Auto-save functionality
  const {
    isSaving,
    lastSaved,
    error: saveError,
  } = useAutoSave({
    onSave: async () => {
      if (!activeTab || !contentChanged) return

      // TODO: Implement actual save logic when editor is integrated
      // For now, just simulate a save
      await new Promise(resolve => setTimeout(resolve, 500))
      setContentChanged(false)
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
    console.log('Scene clicked:', sceneId)
    // TODO: Scroll to scene in editor
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
      />

      {/* Save status bar */}
      {activeTab && (
        <div className="border-b px-4 py-2 bg-muted/30">
          <SaveStatus
            isSaving={isSaving}
            lastSaved={lastSaved}
            error={saveError}
            isDirty={contentChanged}
          />
        </div>
      )}

      {/* Editor content */}
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

        {/* Main editor area */}
        <div className="flex-1 overflow-auto bg-background">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-8 px-4">
              <div className="prose prose-lg dark:prose-invert">
                <h1>{manuscriptTitle}</h1>
                <p className="text-muted-foreground">
                  Editor content will appear here. Full editor integration coming soon!
                </p>
                <p className="text-sm text-muted-foreground">This workspace now supports:</p>
                <ul>
                  <li>Multiple tabs for working on different manuscripts</li>
                  <li>Chapter and scene navigation in the sidebar</li>
                  <li>Adding/deleting chapters and scenes</li>
                  <li>Tab persistence across sessions</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
