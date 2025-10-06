# AI Editor - Comprehensive Assessment & Enhancement Plan

## Executive Summary

**Current Score: 7/10** - Solid foundation with excellent architecture, but missing critical features for production readiness and competitive differentiation.

The AI Editor is a **novel/fiction writing platform** with AI-powered assistance. It currently provides core manuscript editing, basic AI features, and story organization tools. However, it lacks several critical features that would make it production-ready and competitive in the AI writing tools market.

---

## Table of Contents

1. [Current Implementation Analysis](#current-implementation-analysis)
2. [Critical Gaps Identified](#critical-gaps-identified)
3. [Recommended Enhancements](#recommended-enhancements)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Code Examples](#code-examples)

---

## Current Implementation Analysis

### ✅ What's Working Well (Strengths)

#### 1. **Excellent Database Architecture** (9/10)

- **Comprehensive schema** covering manuscripts, chapters, scenes, characters, locations, plot threads
- **Proper RLS policies** for multi-tenancy and collaboration
- **Automatic triggers** for word count updates and version control
- **Rich metadata support** including emotional beats, tension levels, scene purposes
- **World-building tables** for magic systems, technologies, factions, cultures
- **Publishing workflow** with query letters, submissions, ISBN tracking

**Files:**

- `supabase/migrations/20250101000000_create_ai_editor_tables.sql` (935 lines)

#### 2. **Solid AI Service Layer** (8/10)

- **Multiple AI providers** supported (OpenAI/Anthropic via AIClient)
- **5 core AI features** implemented: expand, rewrite, describe, brainstorm, critique
- **Usage tracking** and token limits
- **Proper prompt engineering** with system prompts and context
- **Type-safe interfaces** for all AI requests/responses

**Files:**

- `src/lib/ai-editor-service.ts` (1258 lines)
- `src/types/ai-editor.ts` (835 lines)
- `app/api/ai/expand/route.ts` (71 lines)

#### 3. **Rich Text Editor** (8/10)

- **TipTap-based** editor with full formatting
- **Version control** with auto-save every 30 seconds
- **Word count tracking** in real-time
- **AI integration** via context menu for selected text
- **Focus mode** for distraction-free writing

**Files:**

- `app/editor/[manuscriptId]/components/RichTextEditor.tsx` (359 lines)

#### 4. **Story Planning Tools** (7/10)

- **Story Bible panel** for characters, locations, plot threads
- **Chapter/Scene navigation** with sidebar
- **Version history** with restore capability
- **Analytics panel** for writing statistics
- **Research panel** for notes and references

**Files:**

- `app/editor/[manuscriptId]/EditorWorkspace.tsx` (620 lines)
- `app/editor/[manuscriptId]/components/AIAssistantPanel.tsx` (475 lines)

---

### ❌ Critical Gaps (What's Missing)

#### 1. **No Real AI Implementation** (Critical Priority 🔴)

**Current State:**

- AI routes exist but many return mock/placeholder data
- No actual OpenAI/Anthropic API integration configured
- Missing environment variables for API keys
- No error handling for API failures

**Impact:** The core value proposition (AI writing assistance) doesn't work

**Evidence:**

```typescript
// app/api/ai/generate-logline/route.ts - Returns template-based, not AI
function generateLoglineSuggestions(title, synopsis, type, genre): string[] {
  const suggestions: string[] = []
  suggestions.push(`When [INCITING INCIDENT], [PROTAGONIST] must [GOAL] to [OUTCOME].`)
  return suggestions.slice(0, 5)
}
```

#### 2. **No Collaborative Editing** (High Priority 🟡)

**Current State:**

- Database schema exists (`manuscript_collaborators`, `scene_comments`)
- No real-time sync (no Supabase Realtime integration)
- No operational presence indicators
- No conflict resolution for simultaneous edits
- Comment system not implemented in UI

**Impact:** Cannot compete with Google Docs-style collaboration

#### 3. **Missing Export Functionality** (High Priority 🟡)

**Current State:**

- Export dialog UI exists but throws errors
- No DOCX generation (supposed to use `@/src/lib/export/docx-export`)
- No PDF export
- No EPUB for ebook distribution
- No industry-standard screenplay formatting (Fountain, Final Draft)

**Impact:** Users can't get their work out of the system

**Evidence:**

```typescript
// src/lib/ai-editor-service.ts lines 1227-1257
static async exportToDocx(manuscriptId: string): Promise<Blob> {
  throw new Error('Use the manuscript export functionality in app/editor/[manuscriptId]')
}
```

#### 4. **No Offline Support** (Medium Priority 🟠)

**Current State:**

- No service worker
- No local storage caching
- No IndexedDB for offline manuscript storage
- Auto-save requires internet connection

**Impact:** Writers lose work if connection drops during writing session

#### 5. **Incomplete Story Bible** (Medium Priority 🟠)

**Current State:**

- Database tables exist for characters, locations, plot threads
- StoryBiblePanel component is basic
- No AI-generated character profiles
- No visual relationship mapping
- No character arc tracking across scenes
- No plot thread visualization

**Impact:** Missing key organizational features for novelists

#### 6. **No Publishing Integration** (Medium Priority 🟠)

**Current State:**

- Database schema exists for query letters, submissions, ISBNs
- No UI for query letter generation
- No submission tracking dashboard
- No integration with publishing platforms (Kindle Direct, IngramSpark)

**Impact:** Missing end-to-end publishing workflow

#### 7. **Missing Analytics & Insights** (Low Priority 🟢)

**Current State:**

- Basic writing session tracking exists
- AnalyticsPanel is minimal
- No readability scores (Flesch-Kincaid, SMOG)
- No pacing analysis
- No sentiment analysis
- No character screen time tracking

**Impact:** Writers lack data-driven insights into their work

#### 8. **No Mobile Responsiveness** (Medium Priority 🟠)

**Current State:**

- Desktop-first design with ResizablePanelGroup
- Rich text toolbar doesn't adapt for mobile
- No touch gestures for formatting
- Sidebar navigation not mobile-optimized

**Impact:** Can't write on tablets/phones effectively

#### 9. **Limited AI Features** (High Priority 🟡)

**Current State:**

- Only 5 AI features: expand, rewrite, describe, brainstorm, critique
- Missing AI features found in competitors:
  - Plot hole detection
  - Character consistency checking
  - Tone/voice matching
  - Genre-specific suggestions
  - Automated outline generation from synopsis
  - Scene blocking/beat sheet generation
  - Dialogue enhancement

**Impact:** Less competitive than Sudowrite, NovelAI, Jasper

#### 10. **No Template System** (Low Priority 🟢)

**Current State:**

- Story structure templates in database (Hero's Journey, Three-Act)
- No UI to apply templates to manuscript
- No scene templates (action scene, dialogue scene, flashback)
- No genre-specific templates (romance meet-cute, thriller chase scene)

**Impact:** Writers start from scratch every time

---

## Recommended Enhancements

### Phase 1: Core AI Implementation (Week 1-2) 🔴

**Priority: Critical - Foundation for all AI features**

1. **Implement Real AI Integration**
   - Configure OpenAI/Anthropic API clients
   - Add proper environment variable handling
   - Implement streaming responses for expand/rewrite
   - Add rate limiting per user tier
   - Implement fallback providers

2. **AI Usage Dashboard**
   - Show remaining credits/tokens
   - Display usage history
   - Add upgrade prompts when limits reached
   - Show model used for each generation

3. **Enhanced AI Features**
   - Plot hole detection (scan full manuscript for inconsistencies)
   - Character consistency checker (track traits, speech patterns)
   - Tone analyzer (maintain consistent voice)
   - Pacing suggestions (flag slow/rushed sections)

### Phase 2: Collaboration & Real-time Sync (Week 3-4) 🟡

**Priority: High - Critical for team-based writing**

1. **Real-time Collaborative Editing**
   - Integrate Supabase Realtime for live updates
   - Implement operational transformation for conflict resolution
   - Add presence indicators (who's viewing/editing)
   - Show cursor positions for collaborators
   - Live comment threading

2. **Advanced Commenting System**
   - Inline comments with text highlighting
   - Threaded conversations
   - @mentions for collaborators
   - Comment resolution workflow
   - Suggestion mode (track changes)

3. **Role-based Permissions**
   - Owner, Co-author, Editor, Beta Reader, Viewer roles
   - Granular permissions (view, comment, edit scenes/chapters)
   - Approval workflow for beta reader feedback

### Phase 3: Export & Publishing (Week 5-6) 🟡

**Priority: High - Users need to publish their work**

1. **Professional Export Formats**
   - **DOCX:** Full manuscript with formatting, styles, headers
   - **PDF:** Print-ready with margins, page numbers, front matter
   - **EPUB:** Valid ebook format with TOC, metadata
   - **Screenplay formats:** Fountain, Final Draft (.fdx), Celtx
   - **Submission packages:** Query letter + synopsis + first 50 pages

2. **Industry-Standard Formatting**
   - Novel standard: Times New Roman 12pt, 1-inch margins
   - Screenplay: Courier 12pt, proper scene headers
   - Query letter templates
   - Synopsis formatting (1-page, 2-page, extended)

3. **Publishing Platform Integration**
   - Kindle Direct Publishing (KDP) API
   - IngramSpark API for print-on-demand
   - Wattpad export
   - Archive of Our Own (AO3) compatible HTML

### Phase 4: Enhanced Story Tools (Week 7-8) 🟠

**Priority: Medium - Improve story organization**

1. **Advanced Story Bible**
   - AI-generated character profiles from descriptions
   - Visual relationship graph (D3.js/Cytoscape)
   - Character arc timeline visualization
   - Plot thread kanban board
   - Location map builder (interactive)

2. **Plot Structure Visualization**
   - Visual beat sheet with drag-and-drop
   - Act structure overlay on manuscript
   - Tension graph across chapters
   - Character screen time per chapter
   - Subplot tracker

3. **Research Integration**
   - Web clipper browser extension
   - PDF annotation import
   - Image reference gallery
   - Wikipedia/research API integration
   - Citation manager

### Phase 5: Mobile & Offline (Week 9-10) 🟠

**Priority: Medium - Accessibility & reliability**

1. **Mobile-First Redesign**
   - Responsive editor with mobile toolbar
   - Touch-optimized gestures
   - Swipe navigation between scenes
   - Voice dictation integration
   - Reading mode for mobile review

2. **Offline-First Architecture**
   - Service worker with background sync
   - IndexedDB for local manuscript storage
   - Conflict-free replicated data type (CRDT) sync
   - Offline mode indicator
   - Queue pending AI requests

3. **Progressive Web App (PWA)**
   - Installable on mobile/desktop
   - Push notifications for comments
   - Offline-capable editor
   - Background sync for auto-save

### Phase 6: Advanced Analytics (Week 11-12) 🟢

**Priority: Low - Nice-to-have insights**

1. **Writing Analytics Dashboard**
   - Daily/weekly/monthly word count trends
   - Writing streak tracking with gamification
   - Productivity heatmap (when you write best)
   - Session focus score (time spent editing vs writing)
   - Goal tracking with milestones

2. **Manuscript Health Metrics**
   - Readability scores (Flesch-Kincaid, SMOG, ARI)
   - Vocabulary diversity (unique words, TTR)
   - Sentence complexity distribution
   - Paragraph length analysis
   - Pacing score (action vs exposition ratio)

3. **AI-Powered Insights**
   - Sentiment analysis per chapter
   - Character emotion arc
   - Plot momentum tracking
   - Genre adherence score
   - Comparable titles analysis

### Phase 7: Template & Productivity (Week 13-14) 🟢

**Priority: Low - Accelerate writing**

1. **Scene Templates Library**
   - Genre-specific templates (romance, thriller, fantasy)
   - Beat-specific templates (inciting incident, midpoint twist)
   - Dialogue templates (confrontation, confession, banter)
   - Description templates (character intro, location reveal)

2. **Automated Workflow**
   - Auto-chapter from scene count
   - Auto-synopsis from chapters
   - Auto-query letter from synopsis
   - Auto-character profiles from mentions
   - Auto-location extraction from scenes

3. **Writing Sprints & Challenges**
   - Timed writing sprints (Pomodoro integration)
   - Word wars (compete with friends)
   - NaNoWriMo integration
   - Daily writing challenges
   - Achievement badges

---

## Implementation Roadmap

### Phase 1: Critical Fixes (2 weeks) 🔴

**Week 1: Real AI Integration**

```bash
Tasks:
1. Set up OpenAI/Anthropic API keys in environment
2. Implement streaming AI responses
3. Add usage tracking and limits
4. Build AI usage dashboard
5. Add error handling and retries
```

**Week 2: Enhanced AI Features**

```bash
Tasks:
1. Plot hole detection (scan manuscript)
2. Character consistency checker
3. Tone analyzer
4. Pacing suggestions
5. Genre-specific enhancements
```

**Deliverables:**

- ✅ Fully functional AI features
- ✅ Usage dashboard with limits
- ✅ 4 new AI features (plot holes, consistency, tone, pacing)

---

### Phase 2: Collaboration (2 weeks) 🟡

**Week 3: Real-time Sync**

```bash
Tasks:
1. Integrate Supabase Realtime
2. Implement presence indicators
3. Add live cursor tracking
4. Build conflict resolution
5. Test multi-user editing
```

**Week 4: Comments & Permissions**

```bash
Tasks:
1. Build inline comment system
2. Add threaded conversations
3. Implement @mentions
4. Create role-based permissions
5. Add suggestion mode
```

**Deliverables:**

- ✅ Real-time collaborative editing
- ✅ Full comment system with threading
- ✅ Granular permissions system

---

### Phase 3: Export & Publishing (2 weeks) 🟡

**Week 5: Export Formats**

```bash
Tasks:
1. Implement DOCX export (docx npm package)
2. Build PDF export (jsPDF)
3. Create EPUB export (epub-gen)
4. Add Fountain/Final Draft export
5. Build submission package generator
```

**Week 6: Publishing Integration**

```bash
Tasks:
1. KDP API integration
2. IngramSpark integration
3. Wattpad export
4. AO3 compatible HTML
5. Query letter builder UI
```

**Deliverables:**

- ✅ 5 export formats (DOCX, PDF, EPUB, Fountain, FDX)
- ✅ Publishing platform integrations
- ✅ Query letter & submission tools

---

### Phase 4: Story Tools (2 weeks) 🟠

**Week 7: Advanced Story Bible**

```bash
Tasks:
1. AI character profile generator
2. Visual relationship graph (D3.js)
3. Character arc timeline
4. Plot thread kanban
5. Location map builder
```

**Week 8: Plot Visualization**

```bash
Tasks:
1. Visual beat sheet
2. Act structure overlay
3. Tension graph
4. Character screen time tracker
5. Subplot visualization
```

**Deliverables:**

- ✅ Enhanced Story Bible with visualizations
- ✅ Plot structure tools
- ✅ Character/location management

---

### Phase 5: Mobile & Offline (2 weeks) 🟠

**Week 9: Mobile Optimization**

```bash
Tasks:
1. Responsive editor redesign
2. Touch gestures
3. Swipe navigation
4. Voice dictation
5. Mobile reading mode
```

**Week 10: Offline Support**

```bash
Tasks:
1. Service worker setup
2. IndexedDB caching
3. CRDT sync implementation
4. PWA manifest
5. Background sync
```

**Deliverables:**

- ✅ Mobile-optimized UI
- ✅ Offline-first architecture
- ✅ PWA with installation

---

### Phase 6: Analytics (2 weeks) 🟢

**Week 11: Writing Analytics**

```bash
Tasks:
1. Dashboard with trends
2. Productivity heatmap
3. Streak tracking
4. Session analytics
5. Goal milestones
```

**Week 12: Manuscript Health**

```bash
Tasks:
1. Readability scores
2. Vocabulary analysis
3. Sentence complexity
4. Pacing analysis
5. AI insights
```

**Deliverables:**

- ✅ Comprehensive analytics dashboard
- ✅ Manuscript health metrics
- ✅ AI-powered insights

---

## Code Examples

### 1. Real AI Integration (Expand Feature)

**Current (Mock):**

```typescript
// app/api/ai/expand/route.ts
export async function POST(request: NextRequest) {
  const response = await aiClient.complete(
    {
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.expand },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
    },
    'expand'
  )

  return NextResponse.json({
    content: response.content,
    tokensUsed: response.tokensUsed,
  })
}
```

**Enhanced (Streaming):**

```typescript
// app/api/ai/expand/route.ts
export async function POST(request: NextRequest) {
  const { user } = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check limits
  const usage = await AIService.checkUsageLimits(user.id)
  if (!usage.canUseAI) {
    return NextResponse.json(
      {
        error: 'AI limit reached',
        limit: usage.wordsLimit,
        used: usage.wordsUsed,
      },
      { status: 429 }
    )
  }

  const body = await request.json()
  const userTier = user.profile?.account_tier || 'free'

  // Get provider based on tier
  const aiClient = getAIClient(userTier)

  // Stream response
  const stream = await aiClient.streamComplete(
    {
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.expand },
        { role: 'user', content: buildExpandPrompt(body) },
      ],
      temperature: 0.8,
      maxTokens: body.length === 'page' ? 1000 : 500,
    },
    'expand'
  )

  // Return streaming response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

---

### 2. Real-time Collaborative Editing

**New Component:**

```typescript
// app/editor/[manuscriptId]/components/CollaborativeEditor.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/src/lib/supabase'
import { Editor } from '@tiptap/react'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { SupabaseProvider } from '@/src/lib/yjs-supabase-provider'

interface CollaborativeEditorProps {
  sceneId: string
  userId: string
  userName: string
}

export function CollaborativeEditor({ sceneId, userId, userName }: CollaborativeEditorProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [presences, setPresences] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    const supabase = createClientSupabaseClient()

    // Create Yjs document
    const ydoc = new Y.Doc()

    // Set up Supabase provider for real-time sync
    const provider = new SupabaseProvider(ydoc, supabase, {
      channel: `scene:${sceneId}`,
      awareness: {
        user: {
          id: userId,
          name: userName,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        },
      },
    })

    // Create editor with collaboration
    const editor = new Editor({
      extensions: [
        StarterKit.configure({
          history: false, // Yjs handles history
        }),
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCursor.configure({
          provider,
          user: {
            name: userName,
            color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          },
        }),
      ],
    })

    // Listen for presence changes
    provider.awareness.on('change', () => {
      const states = provider.awareness.getStates()
      setPresences(new Map(states))
    })

    setEditor(editor)

    return () => {
      provider.destroy()
      editor.destroy()
    }
  }, [sceneId, userId, userName])

  return (
    <div className="relative">
      {/* Presence indicators */}
      <div className="flex gap-2 mb-2">
        {Array.from(presences.values()).map(presence => (
          <div
            key={presence.user.id}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: presence.user.color }}
            />
            <span className="text-xs">{presence.user.name}</span>
          </div>
        ))}
      </div>

      {/* Editor */}
      {editor && <EditorContent editor={editor} />}
    </div>
  )
}
```

**Supabase Realtime Channel:**

```typescript
// src/lib/yjs-supabase-provider.ts
import { createClient } from '@supabase/supabase-js'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'

export class SupabaseProvider {
  private ydoc: Y.Doc
  private channel: any
  public awareness: Awareness

  constructor(ydoc: Y.Doc, supabase: any, options: any) {
    this.ydoc = ydoc
    this.awareness = new Awareness(ydoc)

    // Subscribe to Supabase channel
    this.channel = supabase.channel(options.channel, {
      config: {
        broadcast: { self: true },
        presence: { key: options.awareness.user.id },
      },
    })

    // Handle incoming updates
    this.channel
      .on('broadcast', { event: 'update' }, ({ payload }: any) => {
        Y.applyUpdate(this.ydoc, new Uint8Array(payload.update))
      })
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel.presenceState()
        this.awareness.setLocalState(options.awareness.user)

        // Update awareness with all presences
        Object.values(state).forEach((presence: any) => {
          this.awareness.setLocalStateField('user', presence.user)
        })
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await this.channel.track(options.awareness.user)
        }
      })

    // Send local updates to Supabase
    this.ydoc.on('update', (update: Uint8Array) => {
      this.channel.send({
        type: 'broadcast',
        event: 'update',
        payload: { update: Array.from(update) },
      })
    })
  }

  destroy() {
    this.channel.unsubscribe()
  }
}
```

---

### 3. DOCX Export Implementation

```typescript
// src/lib/export/ai-editor-docx-export.ts
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { ManuscriptService, ChapterService, SceneService } from '@/src/lib/ai-editor-service'

export async function exportManuscriptToDocx(manuscriptId: string): Promise<Blob> {
  // Load manuscript with all chapters and scenes
  const manuscript = await ManuscriptService.getById(manuscriptId)
  if (!manuscript) throw new Error('Manuscript not found')

  const chapters = await ChapterService.getByManuscriptId(manuscriptId)

  // Build document sections
  const sections: any[] = []

  // Title page
  sections.push(
    new Paragraph({
      text: manuscript.title.toUpperCase(),
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 400 },
    })
  )

  if (manuscript.subtitle) {
    sections.push(
      new Paragraph({
        text: manuscript.subtitle,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    )
  }

  // Author info
  sections.push(
    new Paragraph({
      text: `by ${manuscript.user?.full_name || 'Author Name'}`,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
    })
  )

  // Page break
  sections.push(new Paragraph({ text: '', pageBreakBefore: true }))

  // Chapters and scenes
  for (const chapter of chapters) {
    const scenes = await SceneService.getByChapterId(chapter.id)

    // Chapter title
    sections.push(
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    )

    // Chapter summary (if exists)
    if (chapter.summary) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: chapter.summary,
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        })
      )
    }

    // Scenes
    for (const scene of scenes) {
      // Parse HTML content to plain text with formatting
      const paragraphs = parseHtmlToParagraphs(scene.content)
      sections.push(...paragraphs)

      // Scene break
      sections.push(
        new Paragraph({
          text: '* * *',
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        })
      )
    }

    // Chapter break
    sections.push(new Paragraph({ text: '', pageBreakBefore: true }))
  }

  // Create document
  const doc = new Document({
    creator: 'Script Soiree AI Editor',
    title: manuscript.title,
    description: manuscript.logline || manuscript.synopsis,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: sections,
      },
    ],
  })

  // Generate blob
  const blob = await Packer.toBlob(doc)
  return blob
}

function parseHtmlToParagraphs(html: string): Paragraph[] {
  // Simple HTML to paragraph conversion
  // In production, use DOMParser or cheerio
  const paragraphs: Paragraph[] = []

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  const elements = tempDiv.querySelectorAll('p, h1, h2, h3')

  elements.forEach(el => {
    const text = el.textContent || ''

    if (el.tagName === 'H1') {
      paragraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1 }))
    } else if (el.tagName === 'H2') {
      paragraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2 }))
    } else if (el.tagName === 'H3') {
      paragraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_3 }))
    } else {
      paragraphs.push(new Paragraph({ text }))
    }
  })

  return paragraphs
}
```

**API Route:**

```typescript
// app/api/editor/manuscripts/[id]/export/docx/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { exportManuscriptToDocx } from '@/src/lib/export/ai-editor-docx-export'
import { ManuscriptService } from '@/src/lib/ai-editor-service'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth()

  // Verify ownership
  const manuscript = await ManuscriptService.getById(params.id)
  if (!manuscript || manuscript.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Generate DOCX
  const blob = await exportManuscriptToDocx(params.id)

  // Return file download
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${manuscript.title.replace(/[^a-z0-9]/gi, '_')}.docx"`,
    },
  })
}
```

---

### 4. Plot Hole Detection AI Feature

```typescript
// app/api/ai/plot-holes/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { AIClient } from '@/src/lib/ai/ai-client'
import { ManuscriptService, ChapterService, SceneService } from '@/src/lib/ai-editor-service'

export async function POST(request: NextRequest) {
  const { user } = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { manuscriptId } = await request.json()

  // Load full manuscript
  const manuscript = await ManuscriptService.getById(manuscriptId)
  const chapters = await ChapterService.getByManuscriptId(manuscriptId)

  // Gather all content
  let fullText = `Title: ${manuscript.title}\n\n`
  if (manuscript.premise) fullText += `Premise: ${manuscript.premise}\n\n`

  for (const chapter of chapters) {
    const scenes = await SceneService.getByChapterId(chapter.id)
    fullText += `\n## ${chapter.title}\n\n`
    for (const scene of scenes) {
      fullText += scene.content.replace(/<[^>]*>/g, '') + '\n\n' // Strip HTML
    }
  }

  // AI analysis
  const aiClient = new AIClient(user.profile?.account_tier || 'free')

  const prompt = `Analyze this manuscript for plot holes, inconsistencies, and logical errors.

Manuscript:
${fullText}

Identify:
1. Timeline inconsistencies (character is in two places at once)
2. Character behavior inconsistencies (acts out of character)
3. Plot holes (unexplained events, missing cause-effect)
4. Continuity errors (object appears/disappears)
5. Logic problems (impossible physics, contradictions)

Format as JSON array:
[
  {
    "type": "timeline|character|plot|continuity|logic",
    "severity": "low|medium|high",
    "location": "Chapter X, Scene Y",
    "issue": "Brief description of the problem",
    "suggestion": "How to fix it"
  }
]`

  const response = await aiClient.complete(
    {
      messages: [
        {
          role: 'system',
          content: 'You are an expert editor specializing in narrative consistency.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3, // Lower for analytical tasks
      maxTokens: 3000,
    },
    'plot-holes'
  )

  // Parse JSON response
  let issues = []
  try {
    issues = JSON.parse(response.content)
  } catch {
    // Fallback if not valid JSON
    issues = [
      {
        type: 'analysis',
        severity: 'medium',
        location: 'Full manuscript',
        issue: response.content,
        suggestion: 'Review the analysis above',
      },
    ]
  }

  // Save report
  await supabase.from('critique_reports').insert({
    manuscript_id: manuscriptId,
    critique_type: 'plot-holes',
    issues_found: issues,
    ai_model: response.model,
  })

  return NextResponse.json({
    success: true,
    issues,
    model: response.model,
    tokensUsed: response.tokensUsed.total,
  })
}
```

**UI Component:**

```typescript
// app/editor/[manuscriptId]/components/PlotHolePanel.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface PlotHole {
  type: string
  severity: 'low' | 'medium' | 'high'
  location: string
  issue: string
  suggestion: string
}

export function PlotHolePanel({ manuscriptId }: { manuscriptId: string }) {
  const [loading, setLoading] = useState(false)
  const [issues, setIssues] = useState<PlotHole[]>([])

  const analyzePlotHoles = async () => {
    setLoading(true)
    const res = await fetch('/api/ai/plot-holes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manuscriptId }),
    })
    const data = await res.json()
    setIssues(data.issues || [])
    setLoading(false)
  }

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">Plot Hole Detection</h2>
        <p className="text-sm text-muted-foreground mb-4">
          AI analysis to find inconsistencies, timeline errors, and logical problems in your manuscript.
        </p>
        <Button onClick={analyzePlotHoles} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              Analyze Manuscript
            </>
          )}
        </Button>
      </div>

      {issues.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Found {issues.length} potential issues</h3>
            <div className="text-sm text-muted-foreground">
              {issues.filter(i => i.severity === 'high').length} high,{' '}
              {issues.filter(i => i.severity === 'medium').length} medium,{' '}
              {issues.filter(i => i.severity === 'low').length} low
            </div>
          </div>

          {issues.map((issue, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-md border ${severityColor(issue.severity)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium capitalize">{issue.type} Issue</span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-white">
                  {issue.location}
                </span>
              </div>
              <p className="text-sm mb-2">{issue.issue}</p>
              <div className="text-xs bg-white/50 p-2 rounded">
                <strong>Suggestion:</strong> {issue.suggestion}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && issues.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
          <p>No analysis run yet. Click analyze to check for plot holes.</p>
        </div>
      )}
    </div>
  )
}
```

---

### 5. Offline Support with Service Worker

```typescript
// public/sw.js
const CACHE_NAME = 'ai-editor-v1'
const OFFLINE_URL = '/offline'

// Resources to cache on install
const STATIC_CACHE = [
  '/',
  '/offline',
  '/editor',
  '/_next/static/css/app.css',
  // Add other critical assets
]

// Install event - cache static resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_CACHE)
    })
  )
  self.skipWaiting()
})

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // API requests - network only with background sync
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Queue for background sync
        return self.registration.sync.register('sync-api-requests')
      })
    )
    return
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response

      return fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Return offline page for navigation
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
        })
    })
  )
})

// Background sync - retry failed API requests
self.addEventListener('sync', event => {
  if (event.tag === 'sync-api-requests') {
    event.waitUntil(syncApiRequests())
  }
})

async function syncApiRequests() {
  // Get pending requests from IndexedDB
  const db = await openDB('pending-requests', 1)
  const requests = await db.getAll('requests')

  for (const request of requests) {
    try {
      await fetch(request.url, request.options)
      await db.delete('requests', request.id)
    } catch (error) {
      console.error('Failed to sync request:', error)
    }
  }
}
```

**Register Service Worker:**

```typescript
// app/editor/layout.tsx
'use client'

import { useEffect } from 'react'

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('Service Worker registered:', reg))
        .catch((err) => console.error('Service Worker registration failed:', err))
    }

    // Check for updates
    if ('serviceWorker' in navigator && 'sync' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.sync.register('sync-api-requests')
      })
    }
  }, [])

  return <>{children}</>
}
```

**Offline Indicator:**

```typescript
// src/components/OfflineIndicator.tsx
'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm">Offline Mode - Changes will sync when online</span>
    </div>
  )
}
```

---

## Summary

The AI Editor has a **solid foundation** (7/10) but requires significant enhancements to be competitive:

### Critical (Must-Have) 🔴

1. ✅ Real AI integration (currently mock/placeholder)
2. ✅ Export functionality (DOCX, PDF, EPUB)
3. ✅ Enhanced AI features (plot holes, consistency, tone)

### High Priority 🟡

4. ✅ Real-time collaboration with Supabase Realtime
5. ✅ Professional publishing workflow
6. ✅ Mobile responsiveness

### Medium Priority 🟠

7. ✅ Advanced Story Bible with visualizations
8. ✅ Offline support with service worker
9. ✅ Enhanced analytics dashboard

### Nice-to-Have 🟢

10. ✅ Template library
11. ✅ Writing sprints & gamification

**Estimated Timeline:** 14 weeks for full implementation
**Minimum Viable Product (MVP):** 6 weeks (Phases 1-3)

---

**Next Steps:**

1. Prioritize based on business goals
2. Set up AI API keys and test real integration
3. Build export functionality for user retention
4. Implement collaboration for team/beta reader workflows
5. Launch MVP with core AI features + export + collaboration
