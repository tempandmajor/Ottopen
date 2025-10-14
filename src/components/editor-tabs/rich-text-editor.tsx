'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Separator } from '@/src/components/ui/separator'
import { cn } from '@/src/lib/utils'
import { DualDialogueExtension } from '@/src/components/editor-tabs/extensions/dual-dialogue'

export interface RichTextEditorRef {
  scrollToHeading: (headingText: string) => void
  getHeadings: () => Array<{ text: string; level: number; id: string }>
}

function classifyScriptLine(
  line: string
): 'scene_heading' | 'character' | 'dialogue' | 'action' | 'transition' | 'unknown' {
  const trimmed = line.trim()
  if (/^(int\.?|ext\.?|int\/ext\.?).+/i.test(trimmed)) return 'scene_heading'
  if (/TO:\s*$/.test(trimmed)) return 'transition'
  if (/^[A-Z ]{2,30}$/.test(trimmed)) return 'character'
  if (/^\s{4,}.+/.test(line)) return 'dialogue'
  if (trimmed.length === 0) return 'action'
  return 'unknown'
}

// Helpers for screenplay mode
function normalizeScriptLine(line: string): string {
  const trimmed = line.trimStart()
  // Scene heading: starts with INT./EXT./INT/EXT., normalize to uppercase
  const sceneHeading = /^(int\.?|ext\.?|int\/ext\.?)/i
  if (sceneHeading.test(trimmed)) {
    return line.toUpperCase()
  }

  // Character cue: line with mostly letters/spaces, already uppercase or should be; short length
  const isLikelyName = /^[A-Za-z ]{2,30}$/.test(trimmed) && trimmed === trimmed.toUpperCase()
  if (isLikelyName) {
    return line.toUpperCase()
  }

  return line
}

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  onHeadingsChange?: (headings: Array<{ text: string; level: number; id: string }>) => void
  placeholder?: string
  editable?: boolean
  className?: string
  showWordCount?: boolean
  maxCharacters?: number
  mode?: 'default' | 'script'
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor(
    {
      content = '',
      onChange,
      onHeadingsChange,
      placeholder = 'Start writing...',
      editable = true,
      className,
      showWordCount = true,
      maxCharacters,
      mode = 'default',
    },
    ref
  ) {
    const editorContainerRef = useRef<HTMLDivElement>(null)
    const normalizingRef = useRef(false)
    // Screenplay keybindings extension (enabled only in script mode)
    const ScreenplayKeys = Extension.create({
      name: 'screenplayKeys',
      addKeyboardShortcuts() {
        const insertAtLineStart = (editor: any, text: string) => {
          const { state } = editor
          const { $from } = state.selection
          const lineStart = $from.start($from.depth)
          editor.chain().focus().setTextSelection(lineStart).insertContent(text).run()
        }
        const getCurrentLineText = (editor: any): string => {
          const { state } = editor
          const { $from } = state.selection
          const block = $from.node($from.depth)
          return block?.textContent || ''
        }
        return {
          Enter: ({ editor }: any) => {
            if (mode !== 'script') return false
            // Basic cycling:
            // 1) CHARACTER → start dialogue (indent)
            // 2) Dialogue (indented) → continue dialogue on next line with same indent
            // 3) Empty indented line → outdent to action
            const line = getCurrentLineText(editor)
            const trimmed = line.trim()
            const indentMatch = line.match(/^(\s+)/)
            const indent = indentMatch ? indentMatch[1] : ''
            const isCharacter = /^[A-Z ]{2,30}$/.test(trimmed)
            const isIndentedDialogue = indent.length >= 4

            if (isCharacter) {
              editor.chain().focus().insertContent('\n    ').run()
              return true
            }
            if (isIndentedDialogue) {
              if (trimmed.length === 0) {
                // Empty indented line → outdent to action
                // Remove up to 4 spaces then insert newline
                const { state, dispatch } = editor
                const { $from } = state.selection
                const lineStart = $from.start($from.depth)
                const remove = Math.min(4, indent.length)
                const tr = state.tr.delete(lineStart, lineStart + remove)
                dispatch(tr)
                editor.chain().focus().insertContent('\n').run()
                return true
              } else {
                // Continue dialogue with same indentation
                editor.chain().focus().insertContent(`\n${indent}`).run()
                return true
              }
            }
            return false
          },
          'Mod-Shift-d': ({ editor }: any) => {
            if (mode !== 'script') return false
            // Toggle (DUAL) on a CHARACTER line to scaffold dual-dialogue pairing
            const { state, dispatch } = editor
            const { $from } = state.selection
            const block = $from.node($from.depth)
            const text = block?.textContent || ''
            if (classifyScriptLine(text) !== 'character') return false
            const from = $from.start($from.depth)
            const to = $from.end($from.depth)
            const hasDual = /\(DUAL\)\s*$/.test(text)
            const newText = hasDual ? text.replace(/\s*\(DUAL\)\s*$/, '') : `${text} (DUAL)`
            // Replace the current block text
            const tr = state.tr.insertText(newText, from, to)
            dispatch(tr)
            return true
          },
          'Shift-Enter': ({ editor, event }: any) => {
            if (mode !== 'script') return false
            // Insert a parenthetical line in dialogue: "    ( )" and place cursor between
            event?.preventDefault?.()
            const { state, dispatch } = editor
            const { from } = state.selection
            const insert = '\n    ()'
            editor.chain().focus().insertContent(insert).run()
            // Move cursor back one char to be between the parentheses
            const pos = from + insert.length - 1
            editor.chain().focus().setTextSelection({ from: pos, to: pos }).run()
            return true
          },
          'Mod-Enter': ({ editor }: any) => {
            if (mode !== 'script') return false
            // If current line looks like a transition (ends with TO:), insert a blank line
            const line = getCurrentLineText(editor)
            if (/TO:\s*$/.test(line)) {
              editor.chain().focus().insertContent('\n').run()
              return true
            }
            return false
          },
          'Alt-Enter': ({ editor, event }: any) => {
            if (mode !== 'script') return false
            // Insert template for a new scene heading
            event?.preventDefault?.()
            editor.chain().focus().insertContent('\nINT. ').run()
            return true
          },
          Tab: ({ editor, event }: any) => {
            if (mode !== 'script') return false
            // Insert indentation at the start of the line to simulate element cycling/indent
            event?.preventDefault?.()
            insertAtLineStart(editor, '    ')
            return true
          },
          'Shift-Tab': ({ editor, event }: any) => {
            if (mode !== 'script') return false
            // Outdent a bit by removing up to 4 leading spaces
            event?.preventDefault?.()
            const { state, dispatch } = editor
            const { $from } = state.selection
            const lineStart = $from.start($from.depth)
            const lineText = getCurrentLineText(editor)
            const leading = /^\s{1,4}/.exec(lineText)?.[0] || ''
            if (leading.length > 0) {
              const tr = state.tr.delete(lineStart, lineStart + leading.length)
              dispatch(tr)
              return true
            }
            return false
          },
        }
      },
    })

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        CharacterCount.configure({
          limit: maxCharacters,
        }),
        Typography,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Underline,
        ...(mode === 'script' ? [ScreenplayKeys, DualDialogueExtension] : []),
      ],
      content,
      editable,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML())

        // Extract headings for navigation
        if (onHeadingsChange) {
          const headings: Array<{ text: string; level: number; id: string }> = []
          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'heading') {
              const text = node.textContent
              const level = node.attrs.level
              const id = text
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]/g, '')
              headings.push({ text, level, id })
            }
          })
          onHeadingsChange(headings)
        }

        // Minimal screenplay auto-formatting for script mode
        if (mode === 'script') {
          if (normalizingRef.current) return
          try {
            const fullText = editor.getText() || ''
            const lines = fullText.split('\n')
            if (lines.length === 0) return
            const lastIndex = lines.length - 1
            const originalLine = lines[lastIndex]

            const normalizedLine = normalizeScriptLine(originalLine)
            if (normalizedLine !== originalLine) {
              // Replace only the last line text
              const docSize = editor.state.doc.content.size
              const from = Math.max(1, docSize - originalLine.length)
              const to = docSize
              normalizingRef.current = true
              editor
                .chain()
                .focus()
                .setTextSelection({ from, to })
                .insertContent(normalizedLine)
                .run()
            }
          } finally {
            normalizingRef.current = false
          }
        }
      },
    })

    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content)
      }
    }, [content, editor])

    useEffect(() => {
      if (editor) {
        editor.setEditable(editable)
      }
    }, [editable, editor])

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        scrollToHeading: (headingText: string) => {
          const id = headingText
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '')
          const element = editorContainerRef.current?.querySelector(`[data-heading-id="${id}"]`)

          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
            // Highlight the heading briefly
            element.classList.add('highlight-heading')
            setTimeout(() => element.classList.remove('highlight-heading'), 2000)
          }
        },
        getHeadings: () => {
          if (!editor) return []

          const headings: Array<{ text: string; level: number; id: string }> = []
          editor.state.doc.descendants(node => {
            if (node.type.name === 'heading') {
              const text = node.textContent
              const level = node.attrs.level
              const id = text
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]/g, '')
              headings.push({ text, level, id })
            }
          })
          return headings
        },
      }),
      [editor]
    )

    if (!editor) {
      return null
    }

    return (
      <div className={cn('flex flex-col h-full', className)}>
        {/* Toolbar */}
        <div className="border-b bg-muted/30 p-2 sticky top-0 z-10">
          <div className="flex flex-wrap gap-1">
            {/* Text formatting */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive('code')}
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Headings */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Alignment */}
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              active={editor.isActive({ textAlign: 'center' })}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              active={editor.isActive({ textAlign: 'right' })}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              active={editor.isActive({ textAlign: 'justify' })}
              title="Justify"
            >
              <AlignJustify className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Undo/Redo */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>
        </div>

        {/* Editor content */}
        <div ref={editorContainerRef} className="flex-1 overflow-auto">
          <EditorContent editor={editor} className="h-full prose prose-lg max-w-none p-8" />
        </div>

        {/* Status bar */}
        {showWordCount && (
          <div className="border-t bg-muted/30 px-4 py-2 text-sm text-muted-foreground flex justify-between items-center">
            <div className="flex gap-4">
              <span>{editor.storage.characterCount.words()} words</span>
              <span>{editor.storage.characterCount.characters()} characters</span>
              {mode === 'script' && (
                <span>
                  ~{Math.max(1, Math.round((editor.storage.characterCount.words() || 0) / 200))}{' '}
                  pages
                </span>
              )}
            </div>
            {maxCharacters && (
              <div
                className={cn(
                  'text-sm',
                  editor.storage.characterCount.characters() > maxCharacters * 0.9
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                )}
              >
                {editor.storage.characterCount.characters()} / {maxCharacters}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title?: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn('h-8 w-8 p-0', active && 'bg-secondary')}
    >
      {children}
    </Button>
  )
}
