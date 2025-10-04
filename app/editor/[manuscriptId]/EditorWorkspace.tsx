'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/src/components/ui/resizable'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Download,
  Settings,
  Sparkles,
  BookOpen,
  Users,
  MapPin,
  Network,
  Clock,
  Target,
  Eye,
  EyeOff,
  MoreVertical,
  BarChart3,
  FileText,
  Lightbulb,
  Wand2,
  MessageSquare,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import {
  ManuscriptService,
  ChapterService,
  SceneService,
  CharacterService,
  LocationService,
  PlotThreadService,
  WritingGoalService,
} from '@/src/lib/ai-editor-service'
import { logger } from '@/src/lib/editor-logger'
import type {
  Manuscript,
  Chapter,
  Scene,
  Character,
  Location,
  PlotThread,
} from '@/src/types/ai-editor'
import type { User as SupabaseUser } from '@/src/lib/supabase'
import type { User as AuthUser } from '@supabase/supabase-js'
import { RichTextEditor } from './components/RichTextEditor'
import { ChapterSidebar } from './components/ChapterSidebar'
import { AIAssistantPanel } from './components/AIAssistantPanel'
import ResearchPanel from './components/ResearchPanel'
import { StoryBiblePanel } from './components/StoryBiblePanel'
import { VersionHistoryPanel } from './components/VersionHistoryPanel'
import { AnalyticsPanel } from './components/AnalyticsPanel'
import { ExportDialog } from './components/ExportDialog'

interface EditorWorkspaceProps {
  user: (AuthUser & { profile?: SupabaseUser }) | null
  manuscriptId: string
}

type ViewMode = 'editor' | 'story-bible' | 'outline' | 'analytics'
type SidePanel = 'none' | 'ai-assistant' | 'research' | 'comments' | 'versions'

export function EditorWorkspace({ user, manuscriptId }: EditorWorkspaceProps) {
  // State
  const [manuscript, setManuscript] = useState<Manuscript | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [currentScene, setCurrentScene] = useState<Scene | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [plotThreads, setPlotThreads] = useState<PlotThread[]>([])

  const [viewMode, setViewMode] = useState<ViewMode>('editor')
  const [sidePanel, setSidePanel] = useState<SidePanel>('none')
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  // Writing session tracking
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStartWords, setSessionStartWords] = useState(0)
  const [aiTextToInsert, setAiTextToInsert] = useState<string>('')

  // Load manuscript data
  useEffect(() => {
    loadManuscriptData()
    startWritingSession()

    return () => {
      if (sessionId) {
        endWritingSession()
      }
    }
  }, [manuscriptId])

  const loadManuscriptData = async () => {
    try {
      const [manuscriptData, chaptersData, charactersData, locationsData, plotThreadsData] =
        await Promise.all([
          ManuscriptService.getById(manuscriptId),
          ChapterService.getByManuscriptId(manuscriptId),
          CharacterService.getByManuscriptId(manuscriptId),
          LocationService.getByManuscriptId(manuscriptId),
          PlotThreadService.getByManuscriptId(manuscriptId),
        ])

      setManuscript(manuscriptData)
      setChapters(chaptersData)
      setCharacters(charactersData)
      setLocations(locationsData)
      setPlotThreads(plotThreadsData)

      // Load first chapter's scenes if available
      if (chaptersData.length > 0) {
        loadChapterScenes(chaptersData[0].id)
        setCurrentChapter(chaptersData[0])
      }
    } catch (error) {
      logger.error('Failed to load manuscript data', error as Error, { manuscriptId })
      logger.userError('Failed to load manuscript')
    }
  }

  const loadChapterScenes = async (chapterId: string) => {
    try {
      const scenesData = await SceneService.getByChapterId(chapterId)
      setScenes(scenesData)

      if (scenesData.length > 0) {
        setCurrentScene(scenesData[0])
      }
    } catch (error) {
      logger.error('Failed to load scenes', error as Error, { chapterId })
      logger.userError('Failed to load scenes')
    }
  }

  const startWritingSession = async () => {
    if (!user) return

    try {
      const session = await WritingGoalService.startWritingSession(
        user.id,
        manuscriptId,
        currentScene?.id
      )
      setSessionId(session.id)
      setSessionStartWords(manuscript?.current_word_count || 0)
    } catch (error) {
      logger.error('Failed to start writing session', error as Error, {
        userId: user?.id,
        manuscriptId,
      })
    }
  }

  const endWritingSession = async () => {
    if (!sessionId || !manuscript) return

    try {
      const wordsWritten = manuscript.current_word_count - sessionStartWords
      await WritingGoalService.endWritingSession(sessionId, wordsWritten)
    } catch (error) {
      logger.error('Failed to end writing session', error as Error, { sessionId })
    }
  }

  // Auto-save functionality
  useEffect(() => {
    if (!currentScene || !currentScene.content) return

    const autoSaveTimer = setTimeout(() => {
      handleAutoSave()
    }, 30000) // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer)
  }, [currentScene?.content])

  const handleAutoSave = async () => {
    if (!currentScene) return

    try {
      setIsSaving(true)
      await SceneService.update(currentScene.id, {
        content: currentScene.content,
      })
      setLastSaved(new Date())
    } catch (error) {
      logger.error('Auto-save failed', error as Error, { sceneId: currentScene?.id })
    } finally {
      setIsSaving(false)
    }
  }

  const handleManualSave = async () => {
    if (!currentScene) return

    try {
      setIsSaving(true)
      await SceneService.update(currentScene.id, {
        content: currentScene.content,
      })
      await SceneService.saveVersion(currentScene.id, 'Manual Save')
      setLastSaved(new Date())
      toast.success('Saved!')
    } catch (error) {
      logger.error('Save failed', error as Error, { sceneId: currentScene?.id })
      logger.userError('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSceneContentChange = (content: string) => {
    if (!currentScene || !manuscript) return

    const newWordCount = SceneService.countWords(content)
    const wordCountDiff = newWordCount - (currentScene.word_count || 0)

    // Update scene with new content and word count
    setCurrentScene({
      ...currentScene,
      content,
      word_count: newWordCount,
    })

    // Update manuscript word count in real-time
    setManuscript({
      ...manuscript,
      current_word_count: manuscript.current_word_count + wordCountDiff,
    })
  }

  const handleCreateChapter = async () => {
    if (!manuscript) return

    try {
      const newChapter = await ChapterService.create(manuscript.id, {
        title: `Chapter ${chapters.length + 1}`,
      })
      setChapters([...chapters, newChapter])
      toast.success('Chapter created!')
    } catch (error) {
      logger.error('Failed to create chapter', error as Error, { manuscriptId: manuscript.id })
      logger.userError('Failed to create chapter')
    }
  }

  const handleCreateScene = async () => {
    if (!currentChapter) {
      toast.error('Please select a chapter first')
      return
    }

    try {
      const newScene = await SceneService.create(currentChapter.id, {
        title: `Scene ${scenes.length + 1}`,
        content: '',
      })
      setScenes([...scenes, newScene])
      setCurrentScene(newScene)
      toast.success('Scene created!')
    } catch (error) {
      logger.error('Failed to create scene', error as Error, { chapterId: currentChapter.id })
      logger.userError('Failed to create scene')
    }
  }

  const handleSelectChapter = async (chapter: Chapter) => {
    setCurrentChapter(chapter)
    await loadChapterScenes(chapter.id)
  }

  const handleSelectScene = (scene: Scene) => {
    setCurrentScene(scene)
  }

  const handleAIAssist = (action: string, selectedText: string) => {
    setSidePanel('ai-assistant')
  }

  const handleInsertAIText = (text: string) => {
    if (!currentScene) return

    // Set the AI text to insert - RichTextEditor will handle insertion at cursor
    setAiTextToInsert(text)
  }

  const handleAITextInserted = () => {
    // Clear the AI text after insertion
    setAiTextToInsert('')
  }

  const handleRestoreVersion = (content: string) => {
    if (!currentScene) return

    setCurrentScene({
      ...currentScene,
      content,
      word_count: SceneService.countWords(content),
    })
  }

  const toggleVersionHistory = () => {
    setSidePanel(sidePanel === 'versions' ? 'none' : 'versions')
  }

  const toggleAIAssistant = () => {
    setSidePanel(sidePanel === 'ai-assistant' ? 'none' : 'ai-assistant')
  }

  const toggleStoryBible = () => {
    setViewMode(viewMode === 'story-bible' ? 'editor' : 'story-bible')
  }

  if (!manuscript) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <Link href="/editor">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="font-semibold text-lg">{manuscript.title}</h1>
              <p className="text-xs text-muted-foreground">
                {manuscript.current_word_count.toLocaleString()} words
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-save indicator */}
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {isSaving ? (
                <>
                  <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : lastSaved ? (
                <>
                  <Save className="h-3 w-3" />
                  Saved {lastSaved.toLocaleTimeString()}
                </>
              ) : null}
            </div>

            <Button variant="outline" size="sm" onClick={handleManualSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>

            <Button
              variant={sidePanel === 'versions' ? 'default' : 'outline'}
              size="sm"
              onClick={toggleVersionHistory}
              title="Version History"
            >
              <Clock className="h-4 w-4" />
            </Button>

            <Button
              variant={isFocusMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsFocusMode(!isFocusMode)}
            >
              {isFocusMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Manuscript</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>View</DropdownMenuLabel>
                <DropdownMenuItem onClick={toggleStoryBible}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Story Bible
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('analytics')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Target className="h-4 w-4 mr-2" />
                  Outline
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Clock className="h-4 w-4 mr-2" />
                  Timeline
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar - Chapter/Scene Navigation */}
          {!isFocusMode && isLeftSidebarOpen && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <ChapterSidebar
                  manuscriptId={manuscriptId}
                  currentSceneId={currentScene?.id}
                  onSceneSelect={handleSelectScene}
                />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* Main Editor/Content Area */}
          <ResizablePanel defaultSize={sidePanel === 'none' ? 100 : 60}>
            <div className="h-full flex flex-col">
              {viewMode === 'editor' ? (
                <>
                  {/* Scene Title */}
                  {currentScene && (
                    <div className="border-b px-6 py-3 bg-card">
                      <Input
                        value={currentScene.title || ''}
                        onChange={e => setCurrentScene({ ...currentScene, title: e.target.value })}
                        placeholder="Scene title..."
                        className="border-none text-xl font-medium bg-transparent px-0 focus-visible:ring-0"
                      />
                    </div>
                  )}

                  {/* Rich Text Editor */}
                  <div className="flex-1 overflow-auto">
                    {currentScene ? (
                      <RichTextEditor
                        content={currentScene.content}
                        onChange={handleSceneContentChange}
                        onSave={handleManualSave}
                        onAIAssist={handleAIAssist}
                        aiTextToInsert={aiTextToInsert}
                        onAITextInserted={handleAITextInserted}
                        isSaving={isSaving}
                        lastSaved={lastSaved}
                        wordCount={currentScene.word_count}
                        focusMode={isFocusMode}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-center p-8">
                        <div>
                          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-xl font-semibold mb-2">No Scene Selected</h3>
                          <p className="text-muted-foreground mb-4">
                            Create a chapter and scene to start writing
                          </p>
                          <div className="flex gap-2 justify-center">
                            <Button onClick={handleCreateChapter} variant="outline">
                              <Plus className="h-4 w-4 mr-2" />
                              New Chapter
                            </Button>
                            {currentChapter && (
                              <Button onClick={handleCreateScene}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Scene
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : viewMode === 'story-bible' ? (
                <StoryBiblePanel manuscriptId={manuscriptId} />
              ) : viewMode === 'analytics' ? (
                <AnalyticsPanel manuscript={manuscript} userId={user?.id || ''} />
              ) : null}
            </div>
          </ResizablePanel>

          {/* Right Panel - AI Assistant / Comments / Versions */}
          {sidePanel !== 'none' && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={40} minSize={30} maxSize={50}>
                {sidePanel === 'ai-assistant' && (
                  <AIAssistantPanel
                    manuscriptId={manuscriptId}
                    sceneId={currentScene?.id}
                    selectedText=""
                    contextBefore={currentScene?.content || ''}
                    onInsertText={handleInsertAIText}
                  />
                )}
                {sidePanel === 'research' && (
                  <ResearchPanel
                    manuscriptId={manuscriptId}
                    storyContext={{
                      genre: manuscript?.genre,
                      setting: manuscript?.premise || '',
                      timePeriod: '',
                      characters: characters.map(c => c.name),
                      currentScene: currentScene?.content?.substring(0, 500),
                    }}
                    onAddToStoryBible={(content, title) => {
                      // TODO: Implement add to story bible
                      toast.success('Added to Story Bible')
                    }}
                  />
                )}
                {sidePanel === 'versions' && currentScene && (
                  <VersionHistoryPanel
                    sceneId={currentScene.id}
                    currentContent={currentScene.content}
                    onRestore={handleRestoreVersion}
                    onClose={() => setSidePanel('none')}
                  />
                )}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Bottom Toolbar - Quick AI Actions */}
      {!isFocusMode && currentScene && (
        <div className="border-t bg-card px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleAIAssistant} className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI Assistant
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidePanel(sidePanel === 'research' ? 'none' : 'research')}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Research
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Wand2 className="h-4 w-4" />
                Describe
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                Brainstorm
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Critique
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {currentScene.word_count.toLocaleString()} words in this scene
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        manuscript={manuscript}
        chapters={chapters.map(c => ({
          ...c,
          scenes: scenes.filter(s => s.chapter_id === c.id),
        }))}
      />
    </div>
  )
}
