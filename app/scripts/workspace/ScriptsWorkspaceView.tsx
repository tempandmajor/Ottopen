'use client'

import { EditorTabs } from '@/src/components/editor-tabs/editor-tabs'
import { useEditorTabs } from '@/src/hooks/useEditorTabs'
import { ScriptNavigator } from '@/src/components/script-editor/script-navigator'
import { SaveStatus } from '@/src/components/editor-tabs/save-status'
import { EditorSkeleton } from '@/src/components/editor-tabs/editor-skeleton'
import { RichTextEditor } from '@/src/components/editor-tabs/rich-text-editor'
import { useAutoSave } from '@/src/hooks/useAutoSave'
import { useKeyboardShortcuts } from '@/src/hooks/useKeyboardShortcuts'
import { useEffect, useState, Suspense } from 'react'
import type { ScriptElement } from '@/src/types/script-editor'
import { Button } from '@/src/components/ui/button'
import { Film, Plus } from 'lucide-react'

function ScriptWorkspaceContent() {
  const { tabs, activeTabId, activeTab, closeTab, switchTab, createNewTab, reorderTabs } =
    useEditorTabs({
      type: 'script',
      basePath: '/scripts/workspace',
      maxTabs: 10,
    })

  const [elements, setElements] = useState<ScriptElement[]>([])
  const [scriptTitle, setScriptTitle] = useState('')
  const [scriptType, setScriptType] = useState('screenplay')
  const [pageCount, setPageCount] = useState(1)
  const [loading, setLoading] = useState(true)
  const [contentChanged, setContentChanged] = useState(false)
  const [editorContent, setEditorContent] = useState('')

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

  // Load script data when active tab changes
  useEffect(() => {
    if (activeTab) {
      loadScriptData(activeTab.fileId)
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
        description: 'Save current script',
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

  const loadScriptData = async (scriptId: string) => {
    try {
      setLoading(true)

      // Load script details
      const scriptRes = await fetch(`/api/scripts/${scriptId}`)
      if (scriptRes.ok) {
        const { script } = await scriptRes.json()
        setScriptTitle(script.title)
        setScriptType(script.script_type)
        setPageCount(script.page_count || 1)
      }

      // Load script elements
      const elementsRes = await fetch(`/api/scripts/${scriptId}/elements`)
      if (elementsRes.ok) {
        const { elements: elementsData } = await elementsRes.json()
        setElements(elementsData || [])
      }
    } catch (error) {
      console.error('Failed to load script data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSceneClick = (elementId: string) => {
    console.log('Scene clicked:', elementId)
    // TODO: Scroll to scene in editor
  }

  const handleAddScene = () => {
    console.log('Add scene')
    // TODO: Add new scene heading
  }

  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Film className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No scripts open</h2>
          <p className="text-muted-foreground mb-6">
            Open a script from your library or create a new one
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => (window.location.href = '/scripts')} variant="outline">
              Browse Scripts
            </Button>
            <Button onClick={createNewTab}>
              <Plus className="mr-2 h-4 w-4" />
              New Script
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
      {loading ? (
        <EditorSkeleton />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Navigator sidebar */}
          {activeTab && (
            <ScriptNavigator
              scriptId={activeTab.fileId}
              scriptTitle={scriptTitle || activeTab.title}
              scriptType={scriptType}
              elements={elements}
              pageCount={pageCount}
              onSceneClick={handleSceneClick}
              onAddScene={handleAddScene}
            />
          )}

          {/* Main editor area */}
          <div className="flex-1 overflow-hidden bg-white">
            <RichTextEditor
              content={editorContent}
              onChange={content => {
                setEditorContent(content)
                setContentChanged(true)
              }}
              placeholder={`Start writing your script: ${scriptTitle}`}
              showWordCount={true}
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function ScriptsWorkspaceView() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <ScriptWorkspaceContent />
    </Suspense>
  )
}
