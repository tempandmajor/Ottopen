'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Loader2, Sparkles, Check, X } from 'lucide-react'
import type { ScriptElement, ScriptCharacter } from '@/src/types/script-editor'

interface DialogueSuggestion {
  text: string
  reasoning: string
  emotion?: string
}

interface DialogueEnhancementModalProps {
  scriptId: string
  element: ScriptElement
  character?: ScriptCharacter
  onApply: (newDialogue: string) => void
  onClose: () => void
}

export function DialogueEnhancementModal({
  scriptId,
  element,
  character,
  onApply,
  onClose,
}: DialogueEnhancementModalProps) {
  const [suggestions, setSuggestions] = useState<DialogueSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // Auto-fetch suggestions when modal opens
  useEffect(() => {
    if (suggestions.length === 0) {
      fetchSuggestions()
    }
  }, [])

  const fetchSuggestions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/scripts/${scriptId}/ai/dialogue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogue: element.content,
          characterId: character?.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to enhance dialogue')
      }

      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Dialogue enhancement error:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = (suggestionText: string) => {
    onApply(suggestionText)
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enhance Dialogue
            {character && <span className="text-muted-foreground">• {character.name}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Original */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground uppercase">Original</h3>
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <p className="text-sm leading-relaxed">{element.content}</p>
            </div>
            {character?.description && (
              <p className="text-xs text-muted-foreground mt-2">
                Character: {character.description}
              </p>
            )}
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground uppercase">AI Suggestions</h3>

            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <p className="text-sm">No suggestions available</p>
                <Button onClick={fetchSuggestions} variant="outline" size="sm" className="mt-4">
                  Retry
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 space-y-3 cursor-pointer transition-colors ${
                        selectedIndex === index
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedIndex(index)}
                    >
                      {/* Dialogue Text */}
                      <p className="text-sm leading-relaxed font-medium">{suggestion.text}</p>

                      {/* Reasoning */}
                      <p className="text-xs text-muted-foreground italic">{suggestion.reasoning}</p>

                      {/* Emotion Tag */}
                      {suggestion.emotion && (
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                          {suggestion.emotion}
                        </span>
                      )}

                      {/* Apply Button */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            handleApply(suggestion.text)
                          }}
                          className="flex-1"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Use This
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Select a suggestion or close to keep the original
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            {!isLoading && suggestions.length > 0 && (
              <Button onClick={fetchSuggestions} variant="outline">
                <Sparkles className="h-3 w-3 mr-1" />
                Generate More
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
