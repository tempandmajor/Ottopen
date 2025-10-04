'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog'
import { Keyboard } from 'lucide-react'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const shortcuts = [
  {
    category: 'Editor',
    items: [
      { keys: ['Ctrl/Cmd', 'S'], description: 'Save scene' },
      { keys: ['Ctrl/Cmd', 'Z'], description: 'Undo' },
      { keys: ['Ctrl/Cmd', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl/Cmd', 'B'], description: 'Bold' },
      { keys: ['Ctrl/Cmd', 'I'], description: 'Italic' },
      { keys: ['Ctrl/Cmd', 'U'], description: 'Underline' },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { keys: ['Ctrl/Cmd', 'K'], description: 'Quick search' },
      { keys: ['Ctrl/Cmd', 'P'], description: 'Chapter/scene picker' },
      { keys: ['Escape'], description: 'Close panels' },
    ],
  },
  {
    category: 'AI Features',
    items: [
      { keys: ['Ctrl/Cmd', 'Shift', 'E'], description: 'Expand scene' },
      { keys: ['Ctrl/Cmd', 'Shift', 'D'], description: 'Describe' },
      { keys: ['Ctrl/Cmd', 'Shift', 'R'], description: 'Rewrite' },
      { keys: ['Ctrl/Cmd', 'Shift', 'A'], description: 'Open AI Assistant' },
      { keys: ['Ctrl/Cmd', 'Shift', 'S'], description: 'Open Story Bible' },
    ],
  },
  {
    category: 'View',
    items: [
      { keys: ['Ctrl/Cmd', '\\'], description: 'Toggle sidebar' },
      { keys: ['Ctrl/Cmd', 'Shift', 'F'], description: 'Focus mode' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
]

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {shortcuts.map(section => (
            <div key={section.category} className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1 items-center flex-shrink-0">
                      {shortcut.keys.map((key, keyIdx) => (
                        <span key={keyIdx} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border border-border">
                            {key}
                          </kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 text-xs font-semibold bg-muted rounded">?</kbd>{' '}
            anytime to open this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
