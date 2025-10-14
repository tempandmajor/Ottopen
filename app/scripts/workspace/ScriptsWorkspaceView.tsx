'use client'

import { EditorTabs } from '@/src/components/editor-tabs/editor-tabs'
import { useEditorTabs } from '@/src/hooks/useEditorTabs'
import { ScriptNavigator } from '@/src/components/script-editor/script-navigator'
import { SaveStatus } from '@/src/components/editor-tabs/save-status'
import { EditorSkeleton } from '@/src/components/editor-tabs/editor-skeleton'
import { RichTextEditor } from '@/src/components/editor-tabs/rich-text-editor'
import { useAutoSave } from '@/src/hooks/useAutoSave'
import { useKeyboardShortcuts } from '@/src/hooks/useKeyboardShortcuts'
import { useEffect, useState, useRef, Suspense } from 'react'
import type { ScriptElement, Script, ScriptBeat } from '@/src/types/script-editor'
import { Button } from '@/src/components/ui/button'
import { Film, Plus } from 'lucide-react'
import { ScriptToolbar } from '@/src/components/script-editor/script-toolbar'
import { CollaboratorPresenceIndicator } from '@/src/components/script-editor/collaborator-presence'
import { BeatBoard } from '@/src/components/script-editor/beat-board'
import {
  RealtimeCollaborationService,
  type CollaboratorPresence as ScriptPresence,
} from '@/src/lib/realtime-collaboration'
import { useAuth } from '@/src/contexts/auth-context'

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
  const [isLocked, setIsLocked] = useState(false)
  const [revisionColor, setRevisionColor] = useState<Script['revision_color']>('white')
  const [revisionNumber, setRevisionNumber] = useState<number>(1)
  const [beats, setBeats] = useState<ScriptBeat[]>([])
  const [showBeatBoard, setShowBeatBoard] = useState(false)
  const [presences, setPresences] = useState<Record<string, ScriptPresence>>({})
  const collabRef = useRef<RealtimeCollaborationService | null>(null)
  const { user } = useAuth()
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

  // Setup realtime collaborator presence for scripts
  useEffect(() => {
    const setupCollab = async () => {
      if (!activeTab || !user) return
      // Clean up any previous session first
      if (collabRef.current) {
        await collabRef.current.leave()
        collabRef.current = null
      }

      const service = new RealtimeCollaborationService(
        activeTab.fileId,
        user.id,
        user.profile?.display_name || user.email || 'User',
        user.email || ''
      )
      collabRef.current = service

      await service.join(
        // onPresenceChange
        updated => setPresences(updated),
        // onElementUpdate
        (_elementId, _content) => {
          // For now, ignore external content updates here; editor integration can hook this later
        }
      )

      // Heartbeat to keep lastActive updated
      const interval = setInterval(() => {
        service.heartbeat().catch(() => {})
      }, 5000)

      return () => {
        clearInterval(interval)
        service.leave().catch(() => {})
        collabRef.current = null
      }
    }

    const cleanupPromise = setupCollab()
    return () => {
      // Ensure cleanup when deps change
      Promise.resolve(cleanupPromise).then(() => {})
    }
  }, [activeTab?.fileId, user?.id])

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
        setIsLocked(!!script.is_locked)
        setRevisionColor(script.revision_color || 'white')
        setRevisionNumber(script.revision_number || 1)
      }

      // Load script elements
      const elementsRes = await fetch(`/api/scripts/${scriptId}/elements`)
      if (elementsRes.ok) {
        const { elements: elementsData } = await elementsRes.json()
        setElements(elementsData || [])
      }

      // Load beats
      const beatsRes = await fetch(`/api/scripts/${scriptId}/beats`)
      if (beatsRes.ok) {
        const { beats: beatsData } = await beatsRes.json()
        setBeats(beatsData || [])
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
      {/* Toolbar */}
      {activeTab && (
        <ScriptToolbar
          script={{
            id: activeTab.fileId,
            user_id: '',
            title: scriptTitle || activeTab.title,
            script_type: scriptType as Script['script_type'],
            format_standard: 'us_industry',
            genre: [],
            page_count: pageCount,
            revision_color: revisionColor,
            revision_number: revisionNumber,
            is_locked: isLocked,
            status: 'draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }}
          onSave={() => {
            // Trigger manual save behavior
            if (contentChanged && !isSaving) {
              // Simulate save for now
              setContentChanged(false)
            }
          }}
          onToggleLock={() => setIsLocked(prev => !prev)}
          onExportPDF={() => {
            // Basic export navigation or placeholder
            if (activeTab) window.open(`/api/scripts/${activeTab.fileId}/export/pdf`, '_blank')
          }}
          onShowCollaborators={() => {
            // Placeholder: in future, open a collaborators modal
            console.log('Show collaborators')
          }}
          onShowBeatBoard={() => setShowBeatBoard(prev => !prev)}
          onShowAIAssistant={() => console.log('Open AI Assistant (script)')}
          onShowResearch={() => console.log('Open Research (script)')}
          isSaving={isSaving}
        />
      )}
      {/* Tab bar */}
      <EditorTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={switchTab}
        onTabClose={closeTab}
        onTabAdd={createNewTab}
        onTabReorder={reorderTabs}
      />

      {/* Save status bar + collaborator presence */}
      {activeTab && (
        <div className="border-b px-4 py-2 bg-muted/30 flex items-center justify-between sticky top-0 z-20">
          <SaveStatus
            isSaving={isSaving}
            lastSaved={lastSaved}
            error={saveError}
            isDirty={contentChanged}
          />
          <div className="flex items-center gap-2">
            <CollaboratorPresenceIndicator presences={presences} />
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
              mode="script"
              className="h-full"
            />
          </div>

          {/* Beat Board side panel */}
          {activeTab && showBeatBoard && (
            <BeatBoard
              scriptId={activeTab.fileId}
              beats={beats}
              onAddBeat={async beat => {
                const res = await fetch(`/api/scripts/${activeTab.fileId}/beats`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(beat),
                })
                if (res.ok) {
                  const { beat: created } = await res.json()
                  setBeats(prev => [...prev, created])
                }
              }}
              onUpdateBeat={async (beatId, updates) => {
                const res = await fetch(`/api/scripts/${activeTab.fileId}/beats/${beatId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updates),
                })
                if (res.ok) {
                  const { beat: updated } = await res.json()
                  setBeats(prev => prev.map(b => (b.id === beatId ? { ...b, ...updated } : b)))
                }
              }}
              onDeleteBeat={async beatId => {
                const res = await fetch(`/api/scripts/${activeTab.fileId}/beats/${beatId}`, {
                  method: 'DELETE',
                })
                if (res.ok) {
                  setBeats(prev => prev.filter(b => b.id !== beatId))
                }
              }}
            />
          )}
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
