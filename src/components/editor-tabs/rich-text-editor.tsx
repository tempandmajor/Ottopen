'use client'

import { useEditor, EditorContent } from '@tiptap/react'
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

export interface RichTextEditorRef {
  scrollToHeading: (headingText: string) => void
  getHeadings: () => Array<{ text: string; level: number; id: string }>
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
    },
    ref
  ) {
    const editorContainerRef = useRef<HTMLDivElement>(null)
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
