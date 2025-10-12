'use client'

import { Button } from '@/src/components/ui/button'
import { X, Plus, Circle, Check } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface EditorTab {
  id: string
  type: 'manuscript' | 'script'
  fileId: string
  title: string
  isDirty: boolean
  lastSaved: Date | null
}

interface EditorTabsProps {
  tabs: EditorTab[]
  activeTabId: string | null
  onTabChange: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onTabAdd: () => void
  onTabReorder?: (tabs: EditorTab[]) => void
  maxTabs?: number
}

export function EditorTabs({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onTabAdd,
  onTabReorder,
  maxTabs = 10,
}: EditorTabsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex(tab => tab.id === active.id)
      const newIndex = tabs.findIndex(tab => tab.id === over.id)

      const reorderedTabs = arrayMove(tabs, oldIndex, newIndex)
      onTabReorder?.(reorderedTabs)
    }
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    const tab = tabs.find(t => t.id === tabId)

    if (tab?.isDirty) {
      const message = `"${tab.title}" has unsaved changes. Your changes will be lost if you close this tab. Close anyway?`
      if (!confirm(message)) {
        return
      }
    }

    onTabClose(tabId)
  }

  const canAddTab = tabs.length < maxTabs

  return (
    <div className="flex items-center border-b bg-muted/30 overflow-x-auto">
      {/* Tabs with drag and drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex items-center flex-1 min-w-0">
            {tabs.map(tab => (
              <SortableTab
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeTabId}
                onTabChange={onTabChange}
                onTabClose={handleCloseTab}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add tab button */}
      {canAddTab && (
        <Button
          variant="ghost"
          size="sm"
          className="h-10 px-3 rounded-none border-l"
          onClick={onTabAdd}
          title="Open new file"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}

      {/* Tab limit indicator */}
      {!canAddTab && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-l">Max {maxTabs} tabs</div>
      )}
    </div>
  )
}

interface SortableTabProps {
  tab: EditorTab
  isActive: boolean
  onTabChange: (tabId: string) => void
  onTabClose: (e: React.MouseEvent, tabId: string) => void
}

function SortableTab({ tab, isActive, onTabChange, onTabClose }: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTabChange(tab.id)}
      className={cn(
        'group relative flex items-center gap-2 px-4 py-2.5 border-r transition-colors min-w-0 max-w-[200px] cursor-grab active:cursor-grabbing',
        isActive
          ? 'bg-background text-foreground'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted',
        isDragging && 'z-50'
      )}
    >
      {/* Tab title */}
      <span className="text-sm font-medium truncate flex-1">{tab.title}</span>

      {/* Status indicator */}
      <div className="flex-shrink-0">
        {tab.isDirty ? (
          <Circle className="h-2 w-2 fill-current" />
        ) : tab.lastSaved ? (
          <Check className="h-3 w-3 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        ) : null}
      </div>

      {/* Close button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive transition-opacity',
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
        onClick={e => onTabClose(e, tab.id)}
        onPointerDown={e => e.stopPropagation()} // Prevent drag when clicking close
      >
        <X className="h-3 w-3" />
      </Button>

      {/* Active indicator */}
      {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
    </button>
  )
}
