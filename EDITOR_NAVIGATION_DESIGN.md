# Editor Navigation System Design

## Executive Summary

**Problem**: Writers working in the AI Editor and Script Editor lack dedicated navigation for chapters, scenes, and beats—essential for long-form content. The current global sidebar (for Home, Feed, Works, etc.) conflicts with editor-specific navigation needs.

**Solution**: Implement a **dual-sidebar architecture** inspired by Scrivener's Binder and Final Draft's Navigator, where:
- **Global sidebar** (left) remains for app-wide navigation when OUTSIDE editors
- **Editor sidebar** (left) replaces global sidebar with document structure when INSIDE editors
- **Feature panels** (right) for AI tools, research, analytics, etc.

---

## Research: How Professional Writing Tools Handle This

### 1. **Sudowrite** - Hierarchical Document List

**Interface Pattern**:
- **Left Sidebar**: Project documents/chapters organized hierarchically
- **Center**: Active document editor
- **Right Panels**: AI features (toggle-able)

**Key Features**:
- **Scenes** as building blocks within chapters
- Click to jump between documents/chapters instantly
- **Auto-titling** documents once sufficient content written
- **Import Novel** feature auto-splits chapters
- **Beat/Scene Generation** linked to outline structure

**Strengths**:
- Simple, distraction-free document switching
- Tight integration between outline and draft
- Scenes panel shows chapter structure at a glance

---

### 2. **Scrivener** - The Binder (Gold Standard)

**Interface Pattern**:
- **Left**: "Binder" - hierarchical tree view of entire project
- **Center**: Composition/editing area
- **Right**: Inspector with metadata, notes, snapshots

**Key Features**:
- **Folder/Document Hierarchy**: Draft > Chapters > Scenes
- **Drag-and-drop reordering** of any element
- **Arrow key navigation**: Up/down to navigate, left/right to collapse/expand containers
- **Separates manuscript from research**: Manuscript folder vs. Research folder
- **Collections**: Alternative views/groupings of documents
- **Scrivenings Mode**: View multiple documents as continuous text

**Strengths**:
- Ultimate flexibility in organization
- Non-destructive: reorder without affecting content
- Research and writing coexist in same project
- "Bookish Display" for easy chapter navigation

**Binder Organization Patterns**:
```
Project Root
├── Draft/Manuscript (essential folder)
│   ├── Act I
│   │   ├── Chapter 1
│   │   │   ├── Scene 1
│   │   │   └── Scene 2
│   │   └── Chapter 2
│   ├── Act II
│   └── Act III
├── Research
│   ├── Character Sketches
│   ├── Locations
│   └── Historical Notes
└── Trash
```

---

### 3. **Final Draft** - Navigator 2.0

**Interface Pattern**:
- **Left**: Navigator panels (tabbed)
- **Center**: Script editing area
- **Bottom**: Beat Board (optional)

**Key Features**:
- **Navigator 2.0 Tabs**:
  - **Script Tab**: Table of contents showing acts, sequences, scenes, outline
  - **ScriptNotes Tab**: All notes in script
  - **Characters Tab**: Character appearances tracking
- **Structure Elements**: Acts, Sequences, Scene Headings, Outlines
- **Drag-to-Reorder**: Scenes can be dragged in Navigator to reorder in script
- **Summary Column**: Scene summaries appear as outline paragraphs
- **Beat Board**: Visual story beat organization (separate panel)
- **Outline Editor**: Alternative structure view

**Strengths**:
- Industry-standard screenwriting format
- Visual beat/act structure planning
- Inclusivity stats monitoring
- Multiple outline entry points (Navigator, Beat Board, Outline Editor)

**Navigator Views**:
```
Script Tab:
├── ACT ONE
│   ├── Sequence 1
│   │   ├── INT. COFFEE SHOP - DAY
│   │   ├── EXT. STREET - DAY
│   ├── Sequence 2
└── ACT TWO
    └── ...

Beat Board:
┌─────────┬─────────┬─────────┐
│ Setup   │ Conflict│ Resolution│
├─────────┼─────────┼─────────┤
│ Beat 1  │ Beat 4  │ Beat 7  │
│ Beat 2  │ Beat 5  │ Beat 8  │
│ Beat 3  │ Beat 6  │ Beat 9  │
└─────────┴─────────┴─────────┘
```

---

## Current Architecture Analysis

### AI Editor (Manuscript) - `/editor/[manuscriptId]`

**Current Layout**:
```
EditorWorkspace.tsx
├── No explicit navigation sidebar
├── Likely uses RichTextEditor component
└── EditorReducer state management
```

**Missing**:
- Chapter list navigation
- Scene browser
- Quick jump to sections
- Structure overview

**Current Features** (based on components):
- ✅ Version History Panel
- ✅ Story Canvas
- ✅ Chapter Sidebar (exists but needs review)
- ✅ Analytics Panel
- ✅ Research Panel
- ✅ Story Bible Panel
- ✅ Export Dialog

### Script Editor - `/scripts/[scriptId]`

**Current Layout** (from page.tsx analysis):
```
┌────────────────────────────────────────────┐
│ ScriptToolbar (top)                        │
├───────────────────────────┬────────────────┤
│ Script Elements           │ BeatBoard      │
│ (center - main editor)    │ (toggle-able)  │
│                           ├────────────────┤
│                           │ AI Assistant   │
│                           │ (sidePanel=ai) │
│                           ├────────────────┤
│                           │ Research Panel │
│                           │ (sidePanel=    │
│                           │  research)     │
└───────────────────────────┴────────────────┘
```

**State Management**:
- `sidePanel`: 'none' | 'ai' | 'research'
- `showBeatBoard`: boolean

**Missing**:
- Scene Navigator (like Final Draft)
- Act/Sequence structure view
- Quick jump to specific scenes
- Visual page/scene count

**Existing Components**:
- ✅ ScriptToolbar
- ✅ ScriptElement
- ✅ BeatBoard
- ✅ ScriptAIAssistantPanel
- ✅ ScriptResearchPanel
- ✅ DialogueEnhancementModal

---

## Global Sidebar Conflict Analysis

**Current Global Sidebar** (`src/components/sidebar.tsx`):
- Controlled by `useAuth()` context
- Visible when `user` is authenticated
- Shows: Home, Feed, Search, Works, Authors, Clubs, Editors, Submissions, etc.
- Uses `usePathname()` to highlight active route

**The Conflict**:
1. **Space Competition**: Global sidebar takes up left 256px (`w-64` = 16rem)
2. **Context Mismatch**: When editing a script, do you need "Feed" and "Book Clubs"?
3. **Navigation Paradigm**: App navigation vs. document navigation are different mental models

**Example Scenario**:
```
User in Script Editor (/scripts/abc123):
┌────────┬──────────────────────────────┬────────┐
│ Global │ Script Content               │ Beat   │
│ Sidebar│                              │ Board  │
│        │                              │        │
│ Home   │ INT. COFFEE SHOP - DAY       │ Setup  │
│ Feed   │                              │        │
│ Search │ JOHN sits alone...           │ Incite │
│ Works  │                              │        │
│ ...    │                              │        │
└────────┴──────────────────────────────┴────────┘
         ↑
    WASTED SPACE - not relevant to editing!
```

**Better Scenario**:
```
User in Script Editor (/scripts/abc123):
┌────────┬──────────────────────────────┬────────┐
│ Script │ Script Content               │ Beat   │
│ Nav    │                              │ Board  │
│        │                              │        │
│ ACT I  │ INT. COFFEE SHOP - DAY       │ Setup  │
│ └Seq 1 │                              │        │
│  └Sc 1 │ JOHN sits alone...           │ Incite │
│  └Sc 2 │                              │        │
│ ACT II │                              │        │
└────────┴──────────────────────────────┴────────┘
         ↑
    CONTEXTUAL - shows document structure!
```

---

## Proposed Solution: Context-Aware Sidebar System

### Design Principle

**"The sidebar adapts to the user's context"**

- **In App Context** (dashboard, feed, search): Show global navigation
- **In Editor Context** (AI editor, script editor): Show document navigation
- **Always Accessible**: Breadcrumb or hamburger menu for quick app navigation

### Architecture Overview

```typescript
// New hook: useNavigationContext()
type NavigationContext = 'app' | 'ai-editor' | 'script-editor'

function useNavigationContext(): NavigationContext {
  const pathname = usePathname()

  if (pathname.startsWith('/editor/')) return 'ai-editor'
  if (pathname.startsWith('/scripts/')) return 'script-editor'
  return 'app'
}

// Conditional Sidebar Rendering
function AppLayout({ children }) {
  const context = useNavigationContext()

  return (
    <div className="flex h-screen">
      {context === 'app' && <GlobalSidebar />}
      {context === 'ai-editor' && <ManuscriptNavigator />}
      {context === 'script-editor' && <ScriptNavigator />}

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
```

---

## Detailed Component Specifications

### 1. ManuscriptNavigator (AI Editor)

**Purpose**: Navigate chapters, scenes, and manuscript structure

**Layout**:
```
┌─────────────────────────┐
│ [<- Back to Dashboard]  │ ← Breadcrumb
├─────────────────────────┤
│ My Novel Title          │ ← Manuscript name
├─────────────────────────┤
│ 📄 Manuscript (25k)     │ ← Word count
│                         │
│ ▼ Act I                 │ ← Expandable section
│   ▶ Chapter 1 (2.5k)    │
│   ▼ Chapter 2 (3.1k)    │
│     • Scene 1           │ ← Clickable scene
│     • Scene 2           │
│   ▶ Chapter 3 (2.8k)    │
│                         │
│ ▶ Act II                │
│ ▶ Act III               │
│                         │
├─────────────────────────┤
│ + New Chapter           │ ← Quick actions
│ 📊 Analytics            │
│ 🔖 Story Bible          │
│ 📝 Research             │
└─────────────────────────┘
```

**State**:
```typescript
interface ManuscriptNavigatorState {
  manuscript: Manuscript
  chapters: Chapter[]
  scenes: Scene[]
  expandedChapters: Set<string>
  activeSceneId: string | null
}
```

**Key Features**:
- **Hierarchical Tree**: Acts → Chapters → Scenes
- **Word Counts**: Show at chapter/scene level
- **Drag-to-Reorder**: Reorder chapters/scenes (like Scrivener)
- **Expand/Collapse**: Show/hide chapter contents
- **Active Highlighting**: Current editing location
- **Quick Add**: "+ New Chapter" button
- **Keyboard Navigation**: Arrow keys to navigate tree

### 2. ScriptNavigator (Script Editor)

**Purpose**: Navigate scenes, acts, beats with screenplay structure

**Layout**:
```
┌─────────────────────────┐
│ [<- Back to Dashboard]  │
├─────────────────────────┤
│ My Screenplay           │
│ Screenplay • 45 pages   │
├─────────────────────────┤
│ 🎬 Structure            │ ← Tab selector
│ 📝 Scenes               │
│ 🎭 Characters           │
│                         │
│ ▼ ACT ONE (pp. 1-30)    │
│   ▼ Sequence 1          │
│     INT. COFFEE - DAY   │ ← Scene heading
│     EXT. STREET - DAY   │
│   ▶ Sequence 2          │
│                         │
│ ▶ ACT TWO (pp. 31-90)   │
│ ▶ ACT THREE (pp. 91-110)│
│                         │
├─────────────────────────┤
│ + New Scene             │
│ 📊 Beat Board           │
│ 🤖 AI Assistant         │
└─────────────────────────┘
```

**Tabs**:
1. **Structure Tab**: Acts → Sequences → Scenes
2. **Scenes Tab**: Flat list of all scenes with summaries
3. **Characters Tab**: Character appearances/tracking

**State**:
```typescript
interface ScriptNavigatorState {
  script: Script
  elements: ScriptElement[]
  acts: Act[]
  sequences: Sequence[]
  scenes: SceneHeading[]
  characters: Character[]
  activeTab: 'structure' | 'scenes' | 'characters'
  activeSceneId: string | null
}
```

**Key Features**:
- **Act/Sequence Grouping**: Industry-standard structure
- **Page Numbers**: Show page ranges for acts/sequences
- **Scene Summaries**: Hover/click for scene summary
- **Character Tracking**: See which scenes each character appears in
- **Drag-to-Reorder**: Move scenes within/between acts
- **Beat Integration**: Click "Beat Board" to toggle right panel

---

## Layout Configurations

### AI Editor Layout (3-Panel)

```
┌─────────┬───────────────────────┬──────────┐
│Manuscript│ Rich Text Editor     │Analytics │
│Navigator│                       │Panel     │
│(256px)  │ Chapter content...    │(320px)   │
│         │                       │          │
│Ch 1 ✓   │ Lorem ipsum...        │📊 Stats  │
│Ch 2 →   │                       │📖 Bible  │
│Ch 3     │                       │🔬 Research│
│         │                       │          │
│         │                       │          │
└─────────┴───────────────────────┴──────────┘
```

**Panel Management**:
- Left: Always visible (ManuscriptNavigator)
- Center: Always visible (Editor)
- Right: Toggle-able (Analytics/Bible/Research/Version History)

### Script Editor Layout (3-Panel)

```
┌─────────┬───────────────────────┬──────────┐
│ Script  │ Script Elements       │ Beat     │
│Navigator│                       │ Board    │
│(256px)  │ INT. COFFEE - DAY     │(320px)   │
│         │                       │          │
│ACT I    │ JOHN                  │Setup     │
│└Seq 1   │ Hey, Sarah!           │          │
│ └Sc 1 →│                       │Incite    │
│ └Sc 2  │ SARAH                 │          │
│ACT II   │ John! Long time!      │Crisis    │
│         │                       │          │
└─────────┴───────────────────────┴──────────┘
```

**Panel Management**:
- Left: Toggle-able (ScriptNavigator or hidden for fullscreen)
- Center: Always visible (Script)
- Right: Mutually exclusive (Beat Board OR AI Assistant OR Research)

---

## Responsive Behavior

### Desktop (≥1024px)
- All panels visible as designed
- Left sidebar: 256px fixed width
- Right panels: 320-384px fixed width
- Center: Fluid

### Tablet (768px - 1023px)
- Left sidebar: Collapsible hamburger menu (overlay)
- Center: Full width when sidebar collapsed
- Right panels: Full-height overlay when opened

### Mobile (<768px)
- Navigation: Bottom sheet or full-screen overlay
- Center: Full screen
- Right panels: Full-screen modal

---

## Implementation Priority

### Phase 1: Script Navigator (Highest Impact)
**Rationale**: Script editor already has BeatBoard and AI panels—just missing scene navigation

**Tasks**:
1. Create `ScriptNavigator` component
2. Extract scene headings from `elements` array
3. Group by ACT markers (if present)
4. Implement click-to-scroll navigation
5. Add drag-to-reorder (stretch goal)

**Files to Create/Modify**:
- `src/components/script-editor/script-navigator.tsx` (NEW)
- `app/scripts/[scriptId]/page.tsx` (modify layout)
- Add ACT/SEQUENCE element types to `ScriptElement` if missing

### Phase 2: Manuscript Navigator (High Impact)
**Rationale**: AI editor needs chapter/scene organization for long-form content

**Tasks**:
1. Create `ManuscriptNavigator` component
2. Add `chapters` and `scenes` tables to database (if missing)
3. Build chapter/scene hierarchy from manuscript structure
4. Implement collapsible tree view
5. Add word count calculations

**Files to Create/Modify**:
- `src/components/ai-editor/manuscript-navigator.tsx` (NEW)
- `app/editor/[manuscriptId]/EditorWorkspace.tsx` (modify layout)
- Database schema for chapters/scenes
- API routes for chapter/scene CRUD

### Phase 3: Context-Aware Sidebar System
**Rationale**: Unify navigation experience across app

**Tasks**:
1. Create `useNavigationContext()` hook
2. Modify `AppLayout` to conditionally render sidebars
3. Add breadcrumb navigation for editors → dashboard
4. Ensure smooth transitions between contexts

**Files to Create/Modify**:
- `src/hooks/useNavigationContext.ts` (NEW)
- `src/components/app-layout.tsx` (major refactor)
- `src/components/editor-breadcrumb.tsx` (NEW)

---

## Database Schema Additions

### For AI Editor (Chapters/Scenes)

```sql
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chapters_manuscript_id ON chapters(manuscript_id);
CREATE INDEX idx_chapters_order ON chapters(manuscript_id, order_index);

CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  title TEXT,
  order_index INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  content TEXT,
  pov_character TEXT,
  location TEXT,
  time_of_day TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scenes_chapter_id ON scenes(chapter_id);
CREATE INDEX idx_scenes_manuscript_id ON scenes(manuscript_id);
```

### For Script Editor (Acts/Sequences) - Optional

```sql
-- If you want explicit act/sequence tracking beyond element markers
CREATE TABLE IF NOT EXISTS script_acts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  act_number INTEGER NOT NULL,
  start_page INTEGER,
  end_page INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS script_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  act_id UUID NOT NULL REFERENCES script_acts(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  start_page INTEGER,
  end_page INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Note**: You may not need these tables if you infer structure from `script_elements` with `element_type` markers.

---

## User Experience Flow

### Entering the AI Editor

1. User clicks "AI Editor" from global sidebar
2. Route changes to `/editor/[manuscriptId]`
3. `useNavigationContext()` detects context change
4. Global sidebar smoothly transitions to ManuscriptNavigator
5. User sees chapter list on left, editor in center
6. Can toggle Analytics/Bible/Research panels on right

### Navigating Within AI Editor

1. User clicks "Chapter 3" in ManuscriptNavigator
2. Editor scrolls/jumps to Chapter 3 content
3. Active chapter highlights in navigator
4. Word count updates in real-time as user types
5. Can drag Chapter 3 to reorder above Chapter 2

### Returning to Dashboard

1. User clicks "[← Back to Dashboard]" breadcrumb
2. Route changes to `/dashboard`
3. `useNavigationContext()` detects context change
4. ManuscriptNavigator smoothly transitions to GlobalSidebar
5. User sees Home/Feed/Works/etc. again

---

## Accessibility Considerations

1. **Keyboard Navigation**:
   - Arrow keys to navigate tree items
   - Enter to expand/collapse
   - Tab to move between panels
   - Cmd+B (Mac) / Ctrl+B (Windows) to toggle sidebar

2. **Screen Readers**:
   - Proper ARIA labels on tree items
   - Announce expanded/collapsed state
   - Landmark regions for nav/main/complementary

3. **Focus Management**:
   - Trap focus in modal panels
   - Return focus to trigger when closing panels
   - Visible focus indicators

4. **Motion**:
   - Respect `prefers-reduced-motion`
   - Instant transitions if motion disabled

---

## Performance Optimizations

1. **Virtualization**: Use `react-window` for long chapter/scene lists (100+ items)
2. **Lazy Loading**: Load chapter content on-demand, not all at once
3. **Memoization**: Memo tree structure calculations
4. **Debouncing**: Debounce word count updates (500ms)
5. **Code Splitting**: Lazy load navigator components per editor type

---

## Success Metrics

After implementation, measure:

1. **Navigation Speed**: Time to jump between chapters/scenes (target: <200ms)
2. **User Adoption**: % of editor sessions using navigator (target: >80%)
3. **Satisfaction**: Survey question "How easy is it to navigate your manuscript?" (target: 4.5/5)
4. **Reordering Usage**: % of users who reorder chapters/scenes (target: >30%)
5. **Panel Usage**: Which right panels are most used (Analytics vs. Bible vs. Research)

---

## Inspiration Screenshots (Conceptual)

### Scrivener's Binder
- Clean hierarchical tree
- Folder icons for containers
- Document icons for leaves
- Subtle indentation for hierarchy
- Drag handles on hover

### Final Draft's Navigator
- Tabbed interface (Structure/Scenes/Characters)
- Page numbers next to scene headings
- Collapsible act sections
- Visual beat board integration

### Sudowrite's Document List
- Simple, distraction-free list
- Auto-generated titles
- One-click document switching
- Scenes grouped under chapters

---

## Next Steps

1. **Review this design** with team/stakeholders
2. **Create UI mockups** in Figma (optional but recommended)
3. **Start with Phase 1** (Script Navigator) - quickest win
4. **Gather user feedback** via beta testers
5. **Iterate based on usage data**

---

## References

- [Sudowrite Documentation - Interface](https://docs.sudowrite.com/getting-started/dQph1snuwbfMWG9wRjsNug/interface/ubBg2ZEoAwasV98E3ZBwjn)
- [Scrivener Binder Overview](https://www.well-storied.com/blog/breaking-down-the-scrivener-binder)
- [Final Draft Navigator 2.0](https://kb.finaldraft.com/hc/en-us/articles/27788910080020)
- [Final Draft Scene Navigator Video](https://kb.finaldraft.com/hc/en-us/articles/15574927526292)

---

**Last Updated**: 2025-10-12
**Author**: Claude Code (Research & Design)
**Status**: Proposal - Awaiting Review
