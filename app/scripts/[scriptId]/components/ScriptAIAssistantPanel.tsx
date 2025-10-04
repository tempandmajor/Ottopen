'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Textarea } from '@/src/components/ui/textarea'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Sparkles, Send, Loader2, Wand2, FileText, Users, TrendingUp } from 'lucide-react'
import type { ScriptType, ScriptElement, ScriptCharacter } from '@/src/types/script-editor'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ScriptAIAssistantPanelProps {
  scriptId: string
  scriptType: ScriptType
  selectedElement?: ScriptElement
  characters: ScriptCharacter[]
  context: {
    logline?: string
    genre: string[]
    currentPage: number
    totalPages: number
  }
  onEnhanceDialogue?: (element: ScriptElement) => void
  onAnalyzeStructure?: () => void
  onGenerateBeats?: () => void
}

export function ScriptAIAssistantPanel({
  scriptId,
  scriptType,
  selectedElement,
  characters,
  context,
  onEnhanceDialogue,
  onAnalyzeStructure,
  onGenerateBeats,
}: ScriptAIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI writing assistant for screenplay development. I can help you with:\n\n• Dialogue enhancement\n• Character voice consistency\n• Story structure analysis\n• Beat generation\n• Scene development\n• Research questions\n\nWhat would you like help with?`,
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Build context for AI
      const scriptContext = {
        scriptType,
        genre: context.genre,
        logline: context.logline,
        currentPage: context.currentPage,
        totalPages: context.totalPages,
        selectedElement: selectedElement
          ? {
              type: selectedElement.element_type,
              content: selectedElement.content,
            }
          : undefined,
        characters: characters.map(c => ({
          name: c.name,
          description: c.description,
        })),
      }

      const response = await fetch(`/api/scripts/${scriptId}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: scriptContext,
          conversationHistory: messages,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      const assistantMessage: Message = { role: 'assistant', content: data.response }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {context.genre.join(', ')} • Page {context.currentPage}/{context.totalPages}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-border space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          {selectedElement?.element_type === 'dialogue' && onEnhanceDialogue && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEnhanceDialogue(selectedElement)}
              className="justify-start"
            >
              <Wand2 className="h-3 w-3 mr-2" />
              Enhance Dialogue
            </Button>
          )}
          {onAnalyzeStructure && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAnalyzeStructure}
              className="justify-start"
            >
              <TrendingUp className="h-3 w-3 mr-2" />
              Structure
            </Button>
          )}
          {onGenerateBeats && (
            <Button variant="outline" size="sm" onClick={onGenerateBeats} className="justify-start">
              <FileText className="h-3 w-3 mr-2" />
              Generate Beats
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('Analyze character voices for consistency')}
            className="justify-start"
          >
            <Users className="h-3 w-3 mr-2" />
            Character Voice
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about dialogue, structure, characters..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
