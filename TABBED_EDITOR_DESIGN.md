# Tabbed Editor System - Google Docs Style

## Overview
Redesign the AI Editor and Script Editor to use a Google Docs-style tabbed interface instead of dual sidebars, providing a cleaner, more intuitive user experience.

## Current Issues with Dual Sidebar Approach
1. **Confusing Navigation**: Global sidebar vs. editor-specific sidebar creates cognitive load
2. **Context Switching**: Users lose the global navigation when entering editors
3. **Inconsistent UX**: Different navigation patterns across the app
4. **Space Inefficiency**: Two sidebars take up significant screen real estate

## Proposed Solution: Google Docs-Style Tabs

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Global Sidebar (Always Visible)                                 │
│ ┌─────────────┐                                                 │
│ │ Home        │                                                 │
│ │ Feed        │                                                 │
│ │ Search      │                                                 │
│ │ My Works    │                                                 │
│ │ AI Editor   │ ← Shows file browser when clicked              │
│ │ Script Edit │ ← Shows file browser when clicked              │
│ │ Messages    │                                                 │
│ │ Profile     │                                                 │
│ └─────────────┘                                                 │
│                                                                  │
│ Main Content Area:                                              │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ File Browser (when AI/Script Editor clicked)             │   │
│ │ OR                                                        │   │
│ │ Tabbed Editor Interface (when file opened)               │   │
│ └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### User Flow

#### 1. Entering AI Editor
```
User clicks "AI Editor" in sidebar
  ↓
Shows file browser with:
  - List of existing manuscripts
  - "New Manuscript" button
  - Search/filter
  - Sort options (recent, alphabetical, word count)
```

#### 2. Opening/Creating a File
```
User clicks existing manuscript OR "New Manuscript"
  ↓
Opens new tab in editor interface
  ↓
Tab contains:
  - Left: ManuscriptNavigator (chapters/scenes)
  - Center: Editor content
  - Right: AI Assistant panel (optional)
  ↓
Auto-save active (saves every 30 seconds)
```

#### 3. Working with Multiple Files
```
User can open multiple tabs:
┌──────────────────────────────────────────────────────────┐
│ [My Novel] [Short Story] [+]                            │ ← Tab bar
│ ┌──────────┬────────────────────────┬────────────────┐  │
│ │ Chapters │ Editor Content         │ AI Assistant   │  │
│ │ & Scenes │                        │                │  │
│ └──────────┴────────────────────────┴────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Component Architecture

### New Components

#### 1. **FilesBrowser** Component
```typescript
interface FilesBrowserProps {
  type: 'manuscripts' | 'scripts'
  onFileOpen: (fileId: string) => void
  onFileCreate: () => void
}
```

Features:
- Grid or list view toggle
- Search and filter
- Sort options
- File metadata (word count, last edited, created date)
- Thumbnail/cover images
- Quick actions (duplicate, delete, share)

#### 2. **EditorTabs** Component
```typescript
interface EditorTab {
  id: string
  type: 'manuscript' | 'script'
  fileId: string
  title: string
  isDirty: boolean // unsaved changes
  lastSaved: Date | null
}

interface EditorTabsProps {
  tabs: EditorTab[]
  activeTabId: string
  onTabChange: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onTabAdd: () => void
}
```

Features:
- Tab management (open, close, switch)
- Unsaved changes indicator (dot)
- Auto-save status
- Close button with confirmation if unsaved
- Maximum 10 tabs open simultaneously
- Tab persistence in localStorage

#### 3. **EditorWorkspace** Component
```typescript
interface EditorWorkspaceProps {
  tab: EditorTab
  onSave: (content: any) => void
  onClose: () => void
}
```

Features:
- Contains navigator sidebar (Manuscript or Script)
- Main editor content area
- Optional right panel (AI Assistant, Research, etc.)
- Auto-save every 30 seconds
- Save indicator in tab

### Updated Components

#### **Sidebar** Component
Add new navigation items:
```typescript
const editorLinks = [
  {
    icon: BookOpen,
    label: 'AI Editor',
    href: '/editor',
    description: 'Write novels, stories, and manuscripts'
  },
  {
    icon: Film,
    label: 'Script Editor',
    href: '/scripts',
    description: 'Write screenplays, TV scripts, and plays'
  }
]
```

## Routes Structure

### File Browser Routes
- `/editor` - AI Editor file browser (manuscripts)
- `/scripts` - Script Editor file browser (scripts)

### Editor Routes (with tabs)
- `/editor/workspace` - AI Editor workspace with tabs
- `/scripts/workspace` - Script Editor workspace with tabs

Query params for open tabs:
- `/editor/workspace?tabs=id1,id2,id3&active=id2`

## Auto-Save Implementation

### Strategy
```typescript
// Auto-save hook
function useAutoSave(content: string, fileId: string, delay = 30000) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSaving(true)
      await saveToDatabase(fileId, content)
      setLastSaved(new Date())
      setIsSaving(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [content, fileId, delay])

  return { isSaving, lastSaved }
}
```

### Save Indicators
- **Tab**: Show dot for unsaved changes, checkmark when saved
- **Status Bar**: "Saving..." → "All changes saved at 2:30 PM"
- **Keyboard**: Cmd/Ctrl+S for manual save

## Tab Persistence

### LocalStorage Schema
```typescript
interface TabState {
  tabs: {
    id: string
    type: 'manuscript' | 'script'
    fileId: string
    title: string
  }[]
  activeTabId: string
  timestamp: number
}

// Store in localStorage
localStorage.setItem('editor-tabs', JSON.stringify(tabState))
```

### Restore on Load
```typescript
// On app load, restore tabs from localStorage
const savedTabs = localStorage.getItem('editor-tabs')
if (savedTabs) {
  const tabState = JSON.parse(savedTabs)
  // Restore tabs if timestamp is < 24 hours old
  if (Date.now() - tabState.timestamp < 24 * 60 * 60 * 1000) {
    restoreTabs(tabState.tabs, tabState.activeTabId)
  }
}
```

## Benefits of This Approach

### 1. **Consistency**
- Global sidebar always visible and accessible
- Familiar Google Docs/Notion-style UX
- Reduces cognitive load

### 2. **Flexibility**
- Work on multiple files simultaneously
- Quick switching between projects
- Easy comparison between files

### 3. **Efficiency**
- No context switching between navigation modes
- Auto-save removes "save" anxiety
- Tab state persistence across sessions

### 4. **Scalability**
- Easy to add new editor types (Poetry, Technical Writing, etc.)
- Consistent pattern for all future editors
- Extensible tab system

## Implementation Phases

### Phase 1: File Browser (Week 1)
- [ ] Create FilesBrowser component for manuscripts
- [ ] Create FilesBrowser component for scripts
- [ ] Update sidebar with AI Editor and Script Editor links
- [ ] Implement `/editor` and `/scripts` routes

### Phase 2: Tab System (Week 2)
- [ ] Create EditorTabs component
- [ ] Implement tab management logic
- [ ] Add tab persistence to localStorage
- [ ] Create `/editor/workspace` and `/scripts/workspace` routes

### Phase 3: Editor Integration (Week 3)
- [ ] Integrate ManuscriptNavigator into manuscript tabs
- [ ] Integrate ScriptNavigator into script tabs
- [ ] Implement auto-save for both editors
- [ ] Add save indicators and status

### Phase 4: Polish & Testing (Week 4)
- [ ] Add keyboard shortcuts (Cmd+W to close tab, Cmd+T for new tab)
- [ ] Implement unsaved changes confirmation
- [ ] Add loading states and transitions
- [ ] Comprehensive testing

## Migration Strategy

### Backward Compatibility
1. Keep existing `/editor/[manuscriptId]` and `/scripts/[scriptId]` routes
2. Redirect these to workspace with tab query params
3. Show migration banner explaining new tabbed interface
4. Allow users to opt-in during beta period

### Data Migration
- No database changes needed
- Only frontend routing and state management
- Existing chapters/scenes API routes remain unchanged

## Technical Considerations

### Performance
- Lazy load tab content (only active tab renders fully)
- Unmount inactive tabs after 10 minutes
- Debounce auto-save to avoid excessive API calls
- Use React.memo for tab components

### Edge Cases
- Maximum 10 tabs (show warning when limit reached)
- Handle deleted files (close tab if file no longer exists)
- Conflict resolution for simultaneous edits (Operational Transform)
- Offline support (queue saves, sync when online)

## UI/UX Details

### Tab Bar
```
┌─────────────────────────────────────────────────────┐
│ [My Novel •] [Screenplay ✓] [Short Story] [+]      │
│  ↑unsaved    ↑saved         ↑active       ↑new tab │
└─────────────────────────────────────────────────────┘
```

### File Browser Grid
```
┌──────────┬──────────┬──────────┬──────────┐
│ [Cover]  │ [Cover]  │ [Cover]  │ [+ New]  │
│ Title    │ Title    │ Title    │ Manu-    │
│ 45.2k w  │ 12.8k w  │ 3.1k w   │ script   │
│ 2d ago   │ 5d ago   │ 1w ago   │          │
└──────────┴──────────┴──────────┴──────────┘
```

### Status Bar (bottom of editor)
```
┌────────────────────────────────────────────────────┐
│ All changes saved at 2:30 PM  │  12,458 words      │
└────────────────────────────────────────────────────┘
```

## Future Enhancements

### Collaboration
- Show collaborators' cursors in real-time
- Comments and suggestions
- Version history in tab menu

### Templates
- Quick start templates in file browser
- Genre-specific templates
- Import from Word/PDF

### Export
- Export from tab context menu
- Batch export multiple tabs
- Export as PDF, DOCX, Markdown

---

## Summary

This tabbed editor approach provides a cleaner, more intuitive interface that:
1. Maintains global navigation consistency
2. Allows multi-file workflows
3. Provides familiar Google Docs-style UX
4. Scales to future editor types
5. Improves overall user experience

The implementation can be done in phases while maintaining backward compatibility with existing routes.
