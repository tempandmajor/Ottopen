# 🎬 AI-Powered Script Editor - Integration Plan

## Executive Summary

The Script Editor **already has AI backend infrastructure** (11 AI API endpoints), but lacks the **UI/UX layer** to make it accessible to screenwriters. This document outlines how to bring the same AI-powered experience from the AI Editor (novels) to the Script Editor (screenplays).

---

## 🎯 Current State

### ✅ What Exists (Backend)

The Script Editor has **11 AI API endpoints** ready to use:

| Endpoint                                         | Purpose                      | Status     |
| ------------------------------------------------ | ---------------------------- | ---------- |
| `/api/scripts/[scriptId]/ai/dialogue`            | Enhance dialogue             | ✅ Working |
| `/api/scripts/[scriptId]/ai/beats`               | Generate story beats         | ✅ Working |
| `/api/scripts/[scriptId]/ai/structure`           | Analyze 3-act structure      | ✅ Working |
| `/api/scripts/[scriptId]/ai/coverage`            | Professional script coverage | ✅ Working |
| `/api/scripts/[scriptId]/ai/character-voice`     | Develop character voice      | ✅ Working |
| `/api/scripts/[scriptId]/ai/casting`             | Casting suggestions          | ✅ Working |
| `/api/scripts/[scriptId]/ai/budget`              | Budget estimation            | ✅ Working |
| `/api/scripts/[scriptId]/ai/marketing`           | Marketing/pitch materials    | ✅ Working |
| `/api/scripts/[scriptId]/ai/table-read`          | Virtual table read           | ✅ Working |
| `/api/scripts/[scriptId]/ai/writing-room`        | Writers' room brainstorm     | ✅ Working |
| `/api/scripts/[scriptId]/documentary/fact-check` | Fact-check (docs)            | ✅ Working |

**AI Service**: `src/lib/ai-script-service.ts` (using Anthropic Claude)

---

### ❌ What's Missing (Frontend)

The Script Editor UI **does not expose** any AI features:

**Current UI** (`/app/scripts/[scriptId]/page.tsx`):

- ❌ No AI Assistant panel
- ❌ No AI action buttons
- ❌ No context-aware suggestions
- ❌ No research panel
- ❌ No beat board AI integration
- ❌ No dialogue enhancement UI
- ❌ No structure analysis visualization

**Screenwriters have no way to access the AI features that already exist!**

---

## 🚀 Implementation Plan

### Phase 1: Core AI UI Components (Week 1)

#### 1.1 Create AI Assistant Panel for Scripts

**File**: `app/scripts/[scriptId]/components/ScriptAIAssistantPanel.tsx`

Similar to `AIAssistantPanel.tsx` in the AI Editor, but screenplay-specific:

```typescript
interface ScriptAIAssistantPanelProps {
  scriptId: string
  scriptType: ScriptType
  selectedElement?: ScriptElement
  selectedCharacter?: ScriptCharacter
  context: {
    logline?: string
    genre: string[]
    currentPage: number
    totalPages: number
  }
}

export function ScriptAIAssistantPanel({ ... }: ScriptAIAssistantPanelProps) {
  // Features:
  // - Chat interface for screenplay questions
  // - Quick actions: Enhance Dialogue, Analyze Structure, Generate Beats
  // - Context-aware suggestions based on current element
  // - Character voice consistency checker
}
```

**AI Actions**:

- **Enhance Dialogue** - Polish selected dialogue
- **Add Subtext** - Layer meaning beneath dialogue
- **Match Character Voice** - Ensure consistency with established voice
- **Expand Action** - Elaborate action lines
- **Compress Action** - Tighten verbose action
- **Add Visual Detail** - Enhance scene descriptions
- **Suggest Beat** - Recommend story beat for current page

---

#### 1.2 Create Research Panel for Scripts

**File**: `app/scripts/[scriptId]/components/ScriptResearchPanel.tsx`

Integrate Perplexity for screenplay research:

```typescript
interface ScriptResearchPanelProps {
  scriptId: string
  scriptContext: {
    genre: string[]
    logline: string
    setting?: string
    timePeriod?: string
  }
}

// Research types specific to screenwriting:
// - Historical accuracy for period pieces
// - Technical details (police procedures, medical terminology)
// - Location research
// - Cultural authenticity
// - Genre conventions and comparables
```

**Example Queries**:

- "What weapons did 1940s detectives carry?"
- "LAPD homicide investigation procedures 2024"
- "Victorian ballroom etiquette"
- "Mars colony life support systems"

---

#### 1.3 Enhanced Beat Board with AI

**File**: Enhance existing `BeatBoard` component

Add AI-powered features:

- **Generate Beats** button → Calls `/api/scripts/[scriptId]/ai/beats`
- **Suggest Next Beat** → Analyzes current script, suggests what's missing
- **Structure Health Check** → Visual indicators for pacing issues

```typescript
// New features in BeatBoard.tsx:
const handleGenerateBeats = async () => {
  const result = await fetch(`/api/scripts/${scriptId}/ai/beats`, {
    method: 'POST',
    body: JSON.stringify({ logline: script.logline, genre: script.genre[0] }),
  })
  const { beats } = await result.json()
  // Display AI-generated beats with option to add to board
}
```

---

### Phase 2: Screenplay-Specific AI Features (Week 2)

#### 2.1 Dialogue Enhancement Widget

**File**: `app/scripts/[scriptId]/components/DialogueEnhancementWidget.tsx`

**Trigger**: User selects dialogue element, clicks "Enhance" or presses `Cmd+Shift+D`

**Features**:

- Show 3 AI-generated alternatives
- Each with reasoning ("More subtext", "Stronger emotion", "Clearer subtext")
- One-click replace
- Side-by-side comparison
- Undo support

**API**: `/api/scripts/[scriptId]/ai/dialogue`

---

#### 2.2 Structure Analysis Panel

**File**: `app/scripts/[scriptId]/components/StructureAnalysisPanel.tsx`

**Features**:

- Visual 3-act structure breakdown
- Page count health indicators
- Key beat markers (inciting incident, midpoint, climax)
- Pacing heatmap
- Recommendations

**API**: `/api/scripts/[scriptId]/ai/structure`

**UI Example**:

```
Act 1: Pages 1-25 ✅ (Ideal: 20-30)
├─ Inciting Incident: p.12 ⚠️ (Should be 10-15)
└─ Lock-in: p.25 ✅

Act 2: Pages 26-85 ⚠️ (Ideal: 50-60, Actual: 60 - slightly long)
├─ Midpoint: p.55 ✅
├─ Low Point: p.75 ✅
└─ Break into 3: p.85 ✅

Act 3: Pages 86-110 ✅ (Ideal: 20-30)
└─ Climax: p.105 ✅
```

---

#### 2.3 Script Coverage Report

**File**: `app/scripts/[scriptId]/components/CoverageReportPanel.tsx`

**Trigger**: "Get AI Coverage" button in toolbar

**Features**:

- Professional coverage scores (1-10):
  - Logline Strength
  - Character Development
  - Dialogue Quality
  - Structure Adherence
  - Marketability
- Comparable films/shows
- Target audience
- Budget estimation
- Detailed strengths/weaknesses
- Actionable recommendations

**API**: `/api/scripts/[scriptId]/ai/coverage`

---

#### 2.4 Character Voice Analyzer

**File**: `app/scripts/[scriptId]/components/CharacterVoicePanel.tsx`

**Features**:

- Analyze each character's dialogue patterns
- Identify voice consistency issues
- Suggest dialogue that's "out of character"
- Compare character voices (ensure differentiation)
- Generate character voice guidelines

**API**: `/api/scripts/[scriptId]/ai/character-voice`

**Example Output**:

```
SARAH:
Voice: Formal, analytical, uses medical terminology
Patterns: Short sentences, direct questions, avoids contractions
Consistency: 92% ✅

Warning: Line 245 "Gonna check it out" - Inconsistent (Sarah doesn't use contractions)
Suggestion: "I will examine it now"
```

---

### Phase 3: Advanced AI Features (Week 3)

#### 3.1 Virtual Table Read

**File**: `app/scripts/[scriptId]/components/VirtualTableReadPanel.tsx`

**Features**:

- AI reads script in character voices
- Identifies awkward dialogue
- Highlights pacing issues
- Timing analysis (estimated runtime vs. page count)

**API**: `/api/scripts/[scriptId]/ai/table-read`

---

#### 3.2 Writers' Room Brainstorm

**File**: `app/scripts/[scriptId]/components/WritersRoomPanel.tsx`

**Features**:

- AI generates alternative plot directions
- "What if..." scenario generator
- Twist suggestions
- Scene alternatives
- Ending variations

**API**: `/api/scripts/[scriptId]/ai/writing-room`

---

#### 3.3 Production Tools

**3.3.1 Casting Suggestions**

- AI suggests actor types for each character
- Reference performances
- Age range, physicality, tone

**API**: `/api/scripts/[scriptId]/ai/casting`

**3.3.2 Budget Estimation**

- Analyze script for budget implications
- Location costs
- VFX requirements
- Cast size
- Budget range estimation

**API**: `/api/scripts/[scriptId]/ai/budget`

**3.3.3 Marketing Materials**

- Generate logline variations
- One-sheet copy
- Pitch deck content
- Comparable positioning

**API**: `/api/scripts/[scriptId]/ai/marketing`

---

## 🎨 UI/UX Layout

### Updated Script Editor Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Toolbar: Save | Lock | Export PDF | AI Coverage | Research  │
├──────────────┬──────────────────────────────┬───────────────┤
│              │                              │               │
│  Beat Board  │     Script Elements          │  AI Assistant │
│  (Sidebar)   │     (Main Editor)            │  (Sidebar)    │
│              │                              │               │
│  ┌────────┐  │  Scene Heading: INT. OFFICE  │  💬 Chat      │
│  │ Beat 1 │  │  Action: John enters...      │  ─────────    │
│  │ Beat 2 │  │  Character: JOHN             │  Quick Actions│
│  │ [+ AI] │  │  Dialogue: "Hello, Sarah."   │  ┌──────────┐ │
│  └────────┘  │  [Enhance ▼]                 │  │ Enhance  │ │
│              │                              │  │ Dialogue │ │
│  Structure   │  Parenthetical: (nervous)    │  └──────────┘ │
│  ┌────────┐  │  Dialogue: "I need to..."    │  ┌──────────┐ │
│  │ Act 1  │  │                              │  │ Structure│ │
│  │ ▓▓▓░   │  │  [Selected: Dialogue]        │  │ Analysis │ │
│  │ Act 2  │  │                              │  └──────────┘ │
│  │ ▓▓▓▓▓  │  │                              │  ┌──────────┐ │
│  │ Act 3  │  │                              │  │ Research │ │
│  │ ▓░░░   │  │                              │  └──────────┘ │
│  └────────┘  │                              │               │
└──────────────┴──────────────────────────────┴───────────────┘
```

**Key Additions**:

1. **AI Assistant Sidebar** (right) - Always accessible, context-aware
2. **Research Panel** (toggleable) - Perplexity integration
3. **Beat Board AI Button** - Generate/suggest beats
4. **Structure Visualization** - Health indicators
5. **Inline AI Actions** - Enhance selected element
6. **Toolbar AI Button** - Coverage report

---

## 🔧 Technical Implementation

### 1. Update Script Editor Page

**File**: `app/scripts/[scriptId]/page.tsx`

Add state for AI panels:

```typescript
export default function ScriptEditorPage() {
  // ... existing state

  // NEW: AI panel states
  const [sidePanel, setSidePanel] = useState<'none' | 'ai' | 'research' | 'coverage'>('none')
  const [showStructureAnalysis, setShowStructureAnalysis] = useState(false)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  // NEW: AI actions
  const handleEnhanceDialogue = async (elementId: string) => {
    const element = elements.find(e => e.id === elementId)
    if (element?.element_type !== 'dialogue') return

    const response = await fetch(`/api/scripts/${scriptId}/ai/dialogue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dialogue: element.content,
        characterId: element.character_id,
      }),
    })

    const { suggestions } = await response.json()
    // Show suggestions in modal
  }

  // ... rest of implementation
}
```

---

### 2. Create AI Context Builder for Scripts

**File**: `src/lib/ai-script-context-builder.ts`

Similar to `ai-context-builder.ts` but screenplay-specific:

```typescript
export class AIScriptContextBuilder {
  static buildScriptContext(
    script: Script,
    elements: ScriptElement[],
    characters: ScriptCharacter[],
    currentElement?: ScriptElement
  ): string {
    return `
SCRIPT CONTEXT:
Title: ${script.title}
Type: ${script.script_type}
Genre: ${script.genre.join(', ')}
Logline: ${script.logline || 'N/A'}
Current Page: ${script.page_count}

CHARACTERS:
${characters.map(c => `- ${c.name}: ${c.description || 'No description'}`).join('\n')}

CURRENT SCENE:
${this.getCurrentSceneContext(elements, currentElement)}

FORMAT: Industry-standard ${script.format_standard} screenplay format
    `.trim()
  }

  private static getCurrentSceneContext(
    elements: ScriptElement[],
    currentElement?: ScriptElement
  ): string {
    if (!currentElement) return 'No current element selected'

    // Get surrounding context (previous 5 elements, next 2)
    const currentIndex = elements.findIndex(e => e.id === currentElement.id)
    const contextElements = elements.slice(Math.max(0, currentIndex - 5), currentIndex + 3)

    return contextElements
      .map(e => {
        const prefix = e.id === currentElement.id ? '>>> ' : '    '
        return `${prefix}${e.element_type.toUpperCase()}: ${e.content}`
      })
      .join('\n')
  }
}
```

---

### 3. Upgrade AI Script Service to Hybrid Model

**File**: `src/lib/ai-script-service.ts`

Currently uses only Claude. Upgrade to hybrid model:

```typescript
import { AIClient } from './ai/ai-client'
import { selectBestModel } from './ai/ai-provider'

export class AIScriptService {
  /**
   * Enhance dialogue - Use Claude 4.5 Opus (best for creative writing)
   */
  static async enhanceDialogue(
    dialogue: string,
    character?: ScriptCharacter,
    context?: { emotion?: string; instruction?: string; previousLines?: string[] }
  ): Promise<DialogueEnhancement> {
    const { provider, model } = selectBestModel('rewrite', 'premium') // Claude 4.5 Opus

    const prompt = this.buildDialoguePrompt(dialogue, character, context)

    const response = await AIClient.complete({
      messages: [{ role: 'user', content: prompt }],
      provider,
      model,
      maxTokens: 2048,
    })

    return JSON.parse(response.content)
  }

  /**
   * Generate story beats - Use GPT-5 Turbo (best for structure)
   */
  static async generateBeats(
    logline: string,
    genre: string,
    scriptType: ScriptType
  ): Promise<BeatGenerationResult> {
    const { provider, model } = selectBestModel('outline', 'premium') // GPT-5 Turbo

    const prompt = this.buildBeatsPrompt(logline, genre, scriptType)

    const response = await AIClient.complete({
      messages: [{ role: 'user', content: prompt }],
      provider,
      model,
      maxTokens: 4096,
    })

    return JSON.parse(response.content)
  }

  /**
   * Research - Use Perplexity (best for factual queries)
   */
  static async research(
    query: string,
    scriptContext: { genre: string[]; logline: string; timePeriod?: string }
  ): Promise<{ answer: string; citations: string[] }> {
    const { provider, model } = selectBestModel('research', 'premium') // Perplexity

    const contextualQuery = `
SCREENPLAY RESEARCH:
Genre: ${scriptContext.genre.join(', ')}
Logline: ${scriptContext.logline}
${scriptContext.timePeriod ? `Time Period: ${scriptContext.timePeriod}` : ''}

Query: ${query}

Provide accurate, cited information relevant to this screenplay context.
    `.trim()

    const response = await AIClient.complete({
      messages: [{ role: 'user', content: contextualQuery }],
      provider,
      model,
      maxTokens: 2048,
    })

    return {
      answer: response.content,
      citations: response.citations || [],
    }
  }
}
```

---

## 📊 Feature Comparison

| Feature                   | AI Editor (Novels)         | Script Editor (Current) | Script Editor (After)       |
| ------------------------- | -------------------------- | ----------------------- | --------------------------- |
| **AI Chat Assistant**     | ✅                         | ❌                      | ✅                          |
| **Content Enhancement**   | ✅ Expand/Describe/Rewrite | ❌                      | ✅ Enhance Dialogue/Action  |
| **Research (Perplexity)** | ✅                         | ❌                      | ✅                          |
| **Structure Analysis**    | ✅                         | ❌                      | ✅ 3-Act + Beats            |
| **AI-Generated Outlines** | ✅                         | ❌                      | ✅ Beat Generation          |
| **Character Development** | ✅                         | ❌                      | ✅ Voice Analysis           |
| **Coverage/Critique**     | ✅                         | ❌                      | ✅ Professional Coverage    |
| **Specialized Tools**     | ❌                         | ❌                      | ✅ Casting/Budget/Marketing |

---

## 🎯 User Benefits

### For Screenwriters:

**Before** (Current):

- ❌ Manual dialogue polishing
- ❌ Guess at structure issues
- ❌ Leave editor to research
- ❌ Pay for professional coverage ($100-500)
- ❌ No character voice consistency checking
- ❌ Manual beat board creation

**After** (AI-Powered):

- ✅ AI dialogue enhancement in seconds
- ✅ Real-time structure analysis with recommendations
- ✅ In-editor research with citations
- ✅ Instant AI coverage reports (free)
- ✅ Automated character voice analysis
- ✅ AI-generated beat suggestions

**Time Saved**: 5-10 hours per draft
**Cost Saved**: $100-500 per script (coverage)
**Quality Improvement**: Measurable via coverage scores

---

## 🚦 Implementation Phases

### Phase 1: Core UI (Week 1) - 30 hours

- [ ] Create `ScriptAIAssistantPanel.tsx` (8 hours)
- [ ] Create `ScriptResearchPanel.tsx` (6 hours)
- [ ] Add AI buttons to ScriptToolbar (2 hours)
- [ ] Integrate panels into ScriptEditorPage (4 hours)
- [ ] Create `DialogueEnhancementModal.tsx` (6 hours)
- [ ] Add keyboard shortcuts (2 hours)
- [ ] Testing and bug fixes (2 hours)

### Phase 2: Screenplay Features (Week 2) - 35 hours

- [ ] Create `StructureAnalysisPanel.tsx` (10 hours)
- [ ] Create `CoverageReportPanel.tsx` (8 hours)
- [ ] Create `CharacterVoicePanel.tsx` (8 hours)
- [ ] Enhance Beat Board with AI (6 hours)
- [ ] Testing and bug fixes (3 hours)

### Phase 3: Advanced Features (Week 3) - 25 hours

- [ ] Create `VirtualTableReadPanel.tsx` (8 hours)
- [ ] Create `WritersRoomPanel.tsx` (6 hours)
- [ ] Create `CastingPanel.tsx` (4 hours)
- [ ] Create `BudgetPanel.tsx` (4 hours)
- [ ] Testing and bug fixes (3 hours)

**Total**: ~90 hours (2-3 weeks for 1 developer)

---

## 📝 Next Steps

1. **Approve this plan**
2. **Start with Phase 1** (Core UI components)
3. **User testing** after each phase
4. **Iterate based on screenwriter feedback**

---

## ✅ Success Metrics

- **Adoption**: 80%+ of Script Editor users try AI features
- **Retention**: 60%+ use AI features weekly
- **Time Saved**: Average 5+ hours per script
- **Quality**: Coverage scores improve by 15%+
- **Satisfaction**: 4.5+ stars on AI feature reviews

---

**The infrastructure is ready. We just need to expose it to screenwriters! 🎬**
