'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ScriptToolbar } from '@/src/components/script-editor/script-toolbar'
import { ScriptElementComponent } from '@/src/components/script-editor/script-element'
import { BeatBoard } from '@/src/components/script-editor/beat-board'
import { ScriptFormatter } from '@/src/lib/script-formatter'
import { ScriptPDFExporter } from '@/src/lib/script-pdf-export'
import type { Script, ScriptElement, ScriptBeat, ElementType } from '@/src/types/script-editor'

export default function ScriptEditorPage() {
  const params = useParams()
  const scriptId = params.scriptId as string

  const [script, setScript] = useState<Script | null>(null)
  const [elements, setElements] = useState<ScriptElement[]>([])
  const [beats, setBeats] = useState<ScriptBeat[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showBeatBoard, setShowBeatBoard] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (scriptId) {
      fetchScript()
      fetchElements()
      fetchBeats()
    }
  }, [scriptId])

  const fetchScript = async () => {
    try {
      const response = await fetch(`/api/scripts/${scriptId}`)
      if (response.ok) {
        const data = await response.json()
        setScript(data.script)
      }
    } catch (error) {
      console.error('Failed to fetch script:', error)
    }
  }

  const fetchElements = async () => {
    try {
      const response = await fetch(`/api/scripts/${scriptId}/elements`)
      if (response.ok) {
        const data = await response.json()
        setElements(data.elements)
      }
    } catch (error) {
      console.error('Failed to fetch elements:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBeats = async () => {
    try {
      const response = await fetch(`/api/scripts/${scriptId}/beats`)
      if (response.ok) {
        const data = await response.json()
        setBeats(data.beats)
      }
    } catch (error) {
      console.error('Failed to fetch beats:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save all modified elements
      // In a real implementation, you'd track which elements changed
      // and only update those
      await fetch(`/api/scripts/${scriptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updated_at: new Date().toISOString() }),
      })
    } catch (error) {
      console.error('Failed to save script:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleLock = async () => {
    if (!script) return

    try {
      const endpoint = `/api/scripts/${scriptId}/lock`
      const response = await fetch(endpoint, {
        method: script.is_locked ? 'DELETE' : 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setScript(data.script)
      }
    } catch (error) {
      console.error('Failed to toggle lock:', error)
    }
  }

  const handleExportPDF = async () => {
    if (!script) return

    try {
      await ScriptPDFExporter.downloadPDF(script, elements)
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  const handleShowCollaborators = async () => {
    try {
      const response = await fetch(`/api/scripts/${scriptId}/collaborators`)
      if (response.ok) {
        const data = await response.json()
        // Show collaborators in a modal or alert for now
        if (data.collaborators.length === 0) {
          alert('No collaborators yet. Share your script to invite others!')
        } else {
          const collaboratorList = data.collaborators
            .map((c: any) => c.email || c.user_id)
            .join(', ')
          alert(`Collaborators: ${collaboratorList}`)
        }
      }
    } catch (error) {
      console.error('Failed to fetch collaborators:', error)
      alert('Failed to load collaborators. Please try again.')
    }
  }

  const handleAddBeat = async (beat: Partial<ScriptBeat>) => {
    try {
      const response = await fetch(`/api/scripts/${scriptId}/beats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(beat),
      })

      if (response.ok) {
        fetchBeats()
      }
    } catch (error) {
      console.error('Failed to add beat:', error)
    }
  }

  const handleUpdateBeat = async (beatId: string, updates: Partial<ScriptBeat>) => {
    try {
      const response = await fetch(`/api/scripts/${scriptId}/beats/${beatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        fetchBeats()
      }
    } catch (error) {
      console.error('Failed to update beat:', error)
    }
  }

  const handleDeleteBeat = async (beatId: string) => {
    try {
      const response = await fetch(`/api/scripts/${scriptId}/beats/${beatId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchBeats()
      }
    } catch (error) {
      console.error('Failed to delete beat:', error)
    }
  }

  const handleElementClick = (elementId: string) => {
    if (!script?.is_locked) {
      setEditingId(elementId)
    }
  }

  const handleContentChange = (elementId: string, content: string) => {
    setElements(prev => prev.map(el => (el.id === elementId ? { ...el, content } : el)))
  }

  const handleElementTypeChange = (elementId: string, type: ElementType) => {
    setElements(prev => prev.map(el => (el.id === elementId ? { ...el, element_type: type } : el)))
  }

  const handleKeyDown = (e: React.KeyboardEvent, elementId: string, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Create new element below
      const currentElement = elements[index]
      const newElementType = ScriptFormatter.getNextElementType(
        currentElement.element_type,
        script?.script_type || 'screenplay'
      )

      // In a real implementation, you'd create a new element via API
      console.log('Create new element:', newElementType)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Cycle to next element type
      const currentElement = elements[index]
      const nextType = ScriptFormatter.getNextElementType(
        currentElement.element_type,
        script?.script_type || 'screenplay'
      )
      handleElementTypeChange(elementId, nextType)
    }
  }

  if (loading || !script) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading script...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <ScriptToolbar
        script={script}
        onSave={handleSave}
        onToggleLock={handleToggleLock}
        onExportPDF={handleExportPDF}
        onShowCollaborators={handleShowCollaborators}
        onShowBeatBoard={() => setShowBeatBoard(!showBeatBoard)}
        isSaving={isSaving}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Title Page */}
            <div className="text-center mb-12 space-y-4">
              <h1 className="text-3xl font-bold uppercase">{script.title}</h1>
              {script.logline && <p className="text-gray-600">{script.logline}</p>}
              <p className="text-sm text-gray-500">Written by {script.user_id}</p>
            </div>

            {/* Script Elements */}
            <div className="space-y-0">
              {elements.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-600 mb-4">
                    Start writing your script. Press Tab to cycle element types, Enter for new
                    lines.
                  </p>
                  <button
                    onClick={() => handleElementClick('new')}
                    className="text-blue-500 hover:underline"
                  >
                    Click here to begin
                  </button>
                </div>
              ) : (
                elements.map((element, index) => (
                  <div key={element.id} onClick={() => handleElementClick(element.id)}>
                    <ScriptElementComponent
                      element={element}
                      isEditing={editingId === element.id}
                      onContentChange={content => handleContentChange(element.id, content)}
                      onElementTypeChange={type => handleElementTypeChange(element.id, type)}
                      onKeyDown={e => handleKeyDown(e, element.id, index)}
                      scriptType={script.script_type}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {showBeatBoard && (
          <BeatBoard
            scriptId={scriptId}
            beats={beats}
            onAddBeat={handleAddBeat}
            onUpdateBeat={handleUpdateBeat}
            onDeleteBeat={handleDeleteBeat}
          />
        )}
      </div>
    </div>
  )
}
