'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import CharacterCount from '@tiptap/extension-character-count'
import { useEffect, useState } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sparkles,
  RotateCw,
  FileText,
  Eye,
  Save,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Separator } from '@/src/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  onSave?: () => void
  onAIAssist?: (action: string, selectedText: string) => void
  isSaving?: boolean
  lastSaved?: Date | null
  wordCount?: number
  focusMode?: boolean
  placeholder?: string
}

export function RichTextEditor({
  content,
  onChange,
  onSave,
  onAIAssist,
  isSaving = false,
  lastSaved,
  wordCount,
  focusMode = false,
  placeholder = 'Start writing your story...',
}: RichTextEditorProps) {
  const [selectedText, setSelectedText] = useState('')

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
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Typography,
      CharacterCount,
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[600px] px-8 py-6',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const text = editor.state.doc.textBetween(from, to, '')
      setSelectedText(text)
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  const handleAIAction = (action: string) => {
    if (onAIAssist && selectedText) {
      onAIAssist(action, selectedText)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      {!focusMode && (
        <div className="border-b bg-background sticky top-0 z-10">
          <div className="flex items-center gap-1 p-2 flex-wrap">
            {/* Text Formatting */}
            <div className="flex items-center gap-1">
              <Button
                variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                title="Underline (Ctrl+U)"
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                title="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Headings */}
            <div className="flex items-center gap-1">
              <Button
                variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Heading 1"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                title="Heading 3"
              >
                <Heading3 className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Lists */}
            <div className="flex items-center gap-1">
              <Button
                variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button
                variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                title="Quote"
              >
                <Quote className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Text Alignment */}
            <div className="flex items-center gap-1">
              <Button
                variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button
                variant={editor.isActive({ textAlign: 'justify' }) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                title="Justify"
              >
                <AlignJustify className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* AI Actions - Only show if text is selected */}
            {selectedText && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Assist
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleAIAction('expand')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Expand
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAIAction('rewrite')}>
                      <RotateCw className="mr-2 h-4 w-4" />
                      Rewrite
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAIAction('describe')}>
                      <Eye className="mr-2 h-4 w-4" />
                      Describe
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Separator orientation="vertical" className="h-6" />
              </>
            )}

            {/* Save Button */}
            {onSave && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="gap-2 ml-auto"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      {!focusMode && (
        <div className="border-t bg-muted/50 px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              {editor.storage.characterCount.words()} words •{' '}
              {editor.storage.characterCount.characters()} characters
            </span>
            {lastSaved && (
              <span className="text-xs">Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
          {selectedText && (
            <span className="text-xs">
              {selectedText.split(/\s+/).filter(Boolean).length} words selected
            </span>
          )}
        </div>
      )}
    </div>
  )
}
