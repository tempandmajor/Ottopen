'use client'

import { useRef, useEffect } from 'react'
import type { ScriptElement, ElementType } from '@/src/types/script-editor'
import { SCREENPLAY_FORMAT, STAGE_PLAY_FORMAT } from '@/src/lib/script-formatter'

interface ScriptElementProps {
  element: ScriptElement
  isEditing: boolean
  onContentChange: (content: string) => void
  onElementTypeChange: (type: ElementType) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  scriptType:
    | 'screenplay'
    | 'tv_pilot'
    | 'stage_play'
    | 'radio_drama'
    | 'documentary'
    | 'nonfiction_book'
}

export function ScriptElementComponent({
  element,
  isEditing,
  onContentChange,
  onElementTypeChange,
  onKeyDown,
  scriptType,
}: ScriptElementProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [element.content])

  const format = scriptType === 'stage_play' ? STAGE_PLAY_FORMAT : SCREENPLAY_FORMAT
  const style = format[element.element_type] || format.action

  if (!isEditing) {
    return (
      <div
        className="script-element py-1 cursor-text hover:bg-gray-50"
        style={{
          fontFamily: style?.fontFamily,
          fontSize: style?.fontSize,
          marginLeft: style?.marginLeft,
          marginRight: style?.marginRight,
          textAlign: style?.textAlign as any,
          textTransform: style?.textTransform as any,
          fontWeight: style?.fontWeight,
        }}
      >
        {element.content || '\u00A0'}
      </div>
    )
  }

  return (
    <div className="script-element-editor relative">
      <select
        value={element.element_type}
        onChange={e => onElementTypeChange(e.target.value as ElementType)}
        className="absolute left-0 top-0 text-xs bg-blue-100 border border-blue-300 rounded px-1 py-0.5 z-10"
      >
        <option value="scene_heading">Scene Heading</option>
        <option value="action">Action</option>
        <option value="character">Character</option>
        <option value="dialogue">Dialogue</option>
        <option value="parenthetical">(Parenthetical)</option>
        <option value="transition">Transition</option>
        <option value="shot">Shot</option>
        {scriptType === 'stage_play' && (
          <>
            <option value="stage_direction">Stage Direction</option>
            <option value="music_cue">Music Cue</option>
            <option value="sound_effect">Sound Effect</option>
          </>
        )}
      </select>

      <textarea
        ref={textareaRef}
        value={element.content}
        onChange={e => onContentChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="w-full border-none outline-none resize-none bg-blue-50 focus:bg-blue-100"
        style={{
          fontFamily: style?.fontFamily,
          fontSize: style?.fontSize,
          marginLeft: style?.marginLeft,
          marginRight: style?.marginRight,
          textAlign: style?.textAlign as any,
          textTransform: style?.textTransform as any,
          fontWeight: style?.fontWeight,
          minHeight: '24px',
        }}
        rows={1}
      />
    </div>
  )
}
