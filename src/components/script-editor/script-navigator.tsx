'use client'

import { useState, useMemo } from 'react'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Button } from '@/src/components/ui/button'
import { ChevronDown, ChevronRight, Film, Plus, ArrowLeft } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import Link from 'next/link'
import type { ScriptElement } from '@/src/types/script-editor'
import type { ScriptAct, ScriptSceneHeading } from '@/src/types/navigation'

interface ScriptNavigatorProps {
  scriptId: string
  scriptTitle: string
  scriptType: string
  elements: ScriptElement[]
  activeElementId?: string | null
  pageCount?: number
  onSceneClick: (elementId: string) => void
  onAddScene?: () => void
}

export function ScriptNavigator({
  scriptId,
  scriptTitle,
  scriptType,
  elements,
  activeElementId,
  pageCount = 1,
  onSceneClick,
  onAddScene,
}: ScriptNavigatorProps) {
  const [expandedActs, setExpandedActs] = useState<Set<number>>(new Set([1]))

  // Extract scene headings and organize by acts
  const acts = useMemo(() => {
    const sceneElements = elements.filter(el => el.element_type === 'scene_heading')
    const actElements = elements.filter(el => el.element_type === 'act_break')

    // If no explicit ACT markers, treat all scenes as Act I
    if (actElements.length === 0) {
      return [
        {
          act_number: 1,
          title: 'ACT ONE',
          scenes: sceneElements.map((el, idx) => ({
            id: el.id,
            element_type: 'scene_heading' as const,
            content: el.content || '',
            page_number: Math.floor(idx / 3) + 1, // Rough estimate
            order_index: el.order_index,
          })),
        },
      ] as ScriptAct[]
    }

    // Group scenes by act
    const result: ScriptAct[] = []
    let currentActIndex = -1

    actElements.forEach((actEl, idx) => {
      const actNumber = idx + 1
      const actTitle = actEl.content || `ACT ${['ONE', 'TWO', 'THREE'][idx] || actNumber}`

      // Find scenes between this act and the next
      const actOrderIndex = actEl.order_index
      const nextActOrderIndex =
        actElements[idx + 1]?.order_index || elements[elements.length - 1]?.order_index + 1

      const actScenes = sceneElements
        .filter(
          scene => scene.order_index > actOrderIndex && scene.order_index < nextActOrderIndex
        )
        .map(scene => ({
          id: scene.id,
          element_type: 'scene_heading' as const,
          content: scene.content || '',
          order_index: scene.order_index,
        }))

      result.push({
        act_number: actNumber,
        title: actTitle,
        scenes: actScenes,
      })
    })

    return result
  }, [elements])

  const toggleActExpansion = (actNumber: number) => {
    setExpandedActs(prev => {
      const next = new Set(prev)
      if (next.has(actNumber)) {
        next.delete(actNumber)
      } else {
        next.add(actNumber)
      }
      return next
    })
  }

  const formatSceneHeading = (content: string) => {
    // Truncate long scene headings
    return content.length > 35 ? content.substring(0, 35) + '...' : content
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
          <Film className="h-5 w-5 text-primary" />
          <h2 className="font-semibold truncate">{scriptTitle}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {scriptType} • {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </p>
      </div>

      {/* Navigator Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {acts.map(act => {
            const isExpanded = expandedActs.has(act.act_number)

            return (
              <div key={act.act_number} className="mb-1">
                {/* Act Header */}
                <button
                  onClick={() => toggleActExpansion(act.act_number)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="truncate">{act.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {act.scenes.length}
                  </span>
                </button>

                {/* Scenes List */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {act.scenes.length === 0 ? (
                      <div className="px-2 py-2 text-xs text-muted-foreground italic">
                        No scenes yet
                      </div>
                    ) : (
                      act.scenes.map(scene => {
                        const isActive = scene.id === activeElementId

                        return (
                          <button
                            key={scene.id}
                            onClick={() => onSceneClick(scene.id)}
                            className={cn(
                              'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'hover:bg-accent'
                            )}
                          >
                            <span className="text-xs mt-0.5 flex-shrink-0">▸</span>
                            <span className="flex-1 truncate text-xs">
                              {formatSceneHeading(scene.content)}
                            </span>
                            {scene.page_number && (
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                p{scene.page_number}
                              </span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {acts.length === 0 && (
            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
              <Film className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Start writing your script</p>
              <p className="text-xs mt-1">Scenes will appear here</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="border-t p-2 space-y-1">
        {onAddScene && (
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={onAddScene}>
            <Plus className="mr-2 h-4 w-4" />
            New Scene
          </Button>
        )}
      </div>
    </div>
  )
}
