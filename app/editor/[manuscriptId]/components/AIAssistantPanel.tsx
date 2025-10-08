'use client'

import { useState } from 'react'
import {
  Sparkles,
  FileText,
  RotateCw,
  Eye,
  Lightbulb,
  MessageSquare,
  User,
  MapPin,
  BookOpen,
  Settings,
  Loader2,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { cn } from '@/src/lib/utils'
import { Skeleton } from '@/src/components/ui/skeleton'
import { AIDisclaimer } from '@/src/components/AIDisclaimer'

interface AIAssistantPanelProps {
  manuscriptId: string
  sceneId?: string
  selectedText?: string
  contextBefore?: string
  onInsertText?: (text: string) => void
}

type AIFeature =
  | 'expand'
  | 'rewrite'
  | 'describe'
  | 'brainstorm'
  | 'critique'
  | 'character'
  | 'outline'

interface AIResponse {
  content: string
  provider: string
  model: string
  tokensUsed: {
    total: number
    prompt: number
    completion: number
  }
}

export function AIAssistantPanel({
  manuscriptId,
  sceneId,
  selectedText = '',
  contextBefore = '',
  onInsertText,
}: AIAssistantPanelProps) {
  const [activeFeature, setActiveFeature] = useState<AIFeature>('expand')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<AIResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Feature-specific state
  const [expandLength, setExpandLength] = useState<'sentence' | 'paragraph' | 'page'>('paragraph')
  const [rewriteStyle, setRewriteStyle] = useState<
    'vivid' | 'concise' | 'tense' | 'emotional' | 'pov-change'
  >('vivid')
  const [describeType, setDescribeType] = useState<
    'character' | 'setting' | 'action' | 'emotion' | 'object'
  >('setting')
  const [brainstormTopic, setBrainstormTopic] = useState('')
  const [critiqueAspect, setCritiqueAspect] = useState<
    'plot' | 'character' | 'dialogue' | 'pacing' | 'overall'
  >('overall')

  const callAI = async (feature: AIFeature, requestBody: any) => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const res = await fetch(`/api/ai/${feature}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestBody,
          manuscriptId,
          sceneId,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'AI request failed')
      }

      const data = await res.json()
      setResponse(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExpand = () => {
    if (!contextBefore && !selectedText) {
      setError(
        'No context provided. Please select text or ensure there is content before the cursor.'
      )
      return
    }

    callAI('expand', {
      contextBefore: contextBefore || selectedText,
      length: expandLength,
    })
  }

  const handleRewrite = () => {
    if (!selectedText) {
      setError('Please select text to rewrite')
      return
    }

    callAI('rewrite', {
      text: selectedText,
      style: rewriteStyle,
    })
  }

  const handleDescribe = () => {
    if (!selectedText) {
      setError('Please select text or provide a subject to describe')
      return
    }

    callAI('describe', {
      subject: selectedText,
      type: describeType,
      context: contextBefore,
    })
  }

  const handleBrainstorm = () => {
    if (!brainstormTopic) {
      setError('Please enter a topic to brainstorm')
      return
    }

    callAI('brainstorm', {
      topic: brainstormTopic,
      context: contextBefore,
    })
  }

  const handleCritique = () => {
    if (!selectedText && !contextBefore) {
      setError('Please select text to critique')
      return
    }

    callAI('critique', {
      text: selectedText || contextBefore,
      aspect: critiqueAspect,
    })
  }

  const handleInsert = () => {
    if (response?.content && onInsertText) {
      onInsertText(response.content)
      setResponse(null)
    }
  }

  return (
    <div className="flex flex-col h-full border-l bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
      </div>

      {/* AI Disclaimer */}
      <div className="p-4 border-b">
        <AIDisclaimer variant="compact" />
      </div>

      {/* Tabs */}
      <Tabs value={activeFeature} onValueChange={v => setActiveFeature(v as AIFeature)}>
        <div className="border-b">
          <TabsList className="w-full justify-start rounded-none h-auto p-1">
            <TabsTrigger value="expand" className="gap-2">
              <FileText className="h-4 w-4" />
              Expand
            </TabsTrigger>
            <TabsTrigger value="rewrite" className="gap-2">
              <RotateCw className="h-4 w-4" />
              Rewrite
            </TabsTrigger>
            <TabsTrigger value="describe" className="gap-2">
              <Eye className="h-4 w-4" />
              Describe
            </TabsTrigger>
            <TabsTrigger value="brainstorm" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Brainstorm
            </TabsTrigger>
            <TabsTrigger value="critique" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Critique
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Expand Tab */}
            <TabsContent value="expand" className="m-0 space-y-4">
              <div>
                <Label>Expansion Length</Label>
                <RadioGroup value={expandLength} onValueChange={(v: any) => setExpandLength(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sentence" id="sentence" />
                    <Label htmlFor="sentence" className="font-normal">
                      1-2 sentences
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paragraph" id="paragraph" />
                    <Label htmlFor="paragraph" className="font-normal">
                      1-2 paragraphs
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="page" id="page" />
                    <Label htmlFor="page" className="font-normal">
                      Full page (~500 words)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <Button onClick={handleExpand} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Expand Story
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Rewrite Tab */}
            <TabsContent value="rewrite" className="m-0 space-y-4">
              <div>
                <Label>Rewrite Style</Label>
                <Select value={rewriteStyle} onValueChange={(v: any) => setRewriteStyle(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vivid">More Vivid & Descriptive</SelectItem>
                    <SelectItem value="concise">More Concise</SelectItem>
                    <SelectItem value="tense">Increase Tension</SelectItem>
                    <SelectItem value="emotional">More Emotional</SelectItem>
                    <SelectItem value="pov-change">Change POV/Tense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedText && (
                <div>
                  <Label>Selected Text</Label>
                  <div className="p-2 bg-muted rounded-md text-sm max-h-32 overflow-y-auto">
                    {selectedText}
                  </div>
                </div>
              )}
              <Button
                onClick={handleRewrite}
                disabled={loading || !selectedText}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rewriting...
                  </>
                ) : (
                  <>
                    <RotateCw className="mr-2 h-4 w-4" />
                    Rewrite Text
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Describe Tab */}
            <TabsContent value="describe" className="m-0 space-y-4">
              <div>
                <Label>What to Describe</Label>
                <Select value={describeType} onValueChange={(v: any) => setDescribeType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="character">Character Appearance</SelectItem>
                    <SelectItem value="setting">Setting/Location</SelectItem>
                    <SelectItem value="action">Action Sequence</SelectItem>
                    <SelectItem value="emotion">Emotional State</SelectItem>
                    <SelectItem value="object">Object/Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedText && (
                <div>
                  <Label>Subject</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">{selectedText}</div>
                </div>
              )}
              <Button
                onClick={handleDescribe}
                disabled={loading || !selectedText}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Describing...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Generate Description
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Brainstorm Tab */}
            <TabsContent value="brainstorm" className="m-0 space-y-4">
              <div>
                <Label htmlFor="topic">Brainstorm Topic</Label>
                <Textarea
                  id="topic"
                  placeholder="e.g., plot twists for chapter 5, character backstory ideas, world-building details..."
                  value={brainstormTopic}
                  onChange={e => setBrainstormTopic(e.target.value)}
                  rows={4}
                />
              </div>
              <Button
                onClick={handleBrainstorm}
                disabled={loading || !brainstormTopic}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Brainstorming...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Generate Ideas
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Critique Tab */}
            <TabsContent value="critique" className="m-0 space-y-4">
              <div>
                <Label>Focus Area</Label>
                <Select value={critiqueAspect} onValueChange={(v: any) => setCritiqueAspect(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overall">Overall Assessment</SelectItem>
                    <SelectItem value="plot">Plot & Structure</SelectItem>
                    <SelectItem value="character">Character Development</SelectItem>
                    <SelectItem value="dialogue">Dialogue</SelectItem>
                    <SelectItem value="pacing">Pacing & Flow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCritique}
                disabled={loading || (!selectedText && !contextBefore)}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Critique Text
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <Label>AI Response</Label>
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="p-3 bg-muted rounded-md space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground animate-pulse">
                    Generating AI response...
                  </p>
                </div>
              </div>
            )}

            {/* Response Display */}
            {!loading && response && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <Label>AI Response</Label>
                  <div className="text-xs text-muted-foreground">
                    {response.provider} • {response.tokensUsed.total} tokens
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-md text-sm space-y-3 max-h-96 overflow-y-auto">
                  <div className="prose prose-sm max-w-none">{response.content}</div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleInsert} className="flex-1" disabled={!onInsertText}>
                    Insert into Editor
                  </Button>
                  <Button onClick={() => setResponse(null)} variant="outline">
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
