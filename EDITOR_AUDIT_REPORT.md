# 📝 Script Editor Audit Report

**Date:** 2025-01-10
**Component:** Editor Workspace & Associated Features
**Focus:** Issues, Improvements, Progressive Disclosure

---

## 🎯 Executive Summary

The Script Editor is well-architected with solid foundations, but has **significant opportunities** for improvement in:

1. **Progressive Disclosure** - Currently shows too much at once
2. **Error Handling** - Inconsistent patterns
3. **User Onboarding** - Missing guided experience
4. **Performance** - Some optimization opportunities
5. **Accessibility** - Keyboard shortcuts need work

**Overall Grade: B+ (Good, but needs refinement)**

---

## 🔍 Critical Issues Found

### 1. **❌ CRITICAL: Missing Error Boundaries**

**Location:** `app/editor/[manuscriptId]/EditorWorkspace.tsx`

**Issue:**

```typescript
// Lines 115-141: loadManuscriptData
const loadManuscriptData = async () => {
  try {
    const [manuscriptData, chaptersData, ...] = await Promise.all([...])
    // ... but NO error recovery UI
  } catch (error) {
    logger.error('Failed to load manuscript data', error as Error, { manuscriptId })
    logger.userError('Failed to load manuscript') // Toast only!
  }
}
```

**Problem:**

- If manuscript fails to load, user sees spinner forever
- No retry button
- No fallback UI
- User is stuck with no way to recover

**Impact:** HIGH - Users can't use editor at all

**Fix:**

```typescript
const [loadError, setLoadError] = useState<Error | null>(null)

// In loadManuscriptData catch block:
setLoadError(error)

// Add error state UI:
if (loadError) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-semibold">Failed to Load Manuscript</h2>
        <p className="text-muted-foreground">{loadError.message}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
          <Button variant="outline" onClick={() => router.push('/editor')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

### 2. **⚠️ HIGH: Auto-Save Can Lose Data**

**Location:** `app/editor/[manuscriptId]/EditorWorkspace.tsx:185-209`

**Issue:**

```typescript
useEffect(() => {
  if (!currentScene || !currentScene.content) return

  const autoSaveTimer = setTimeout(() => {
    handleAutoSave() // Silently fails if user switches scenes!
  }, 30000)

  return () => clearTimeout(autoSaveTimer)
}, [currentScene?.content]) // Dependency issue!
```

**Problems:**

1. **Race condition:** If user switches scenes before 30s, unsaved changes lost
2. **Silent failures:** `handleAutoSave` catches errors but doesn't notify user clearly
3. **No debouncing:** Every keystroke resets timer - may never save!

**Impact:** HIGH - Data loss risk

**Fix:**

```typescript
import { useAutoSave } from '@/src/hooks/useAutoSave'

// Use proper auto-save hook with debouncing + visual feedback:
const { save, isSaving, lastSaved } = useAutoSave({
  data: currentScene?.content,
  onSave: async content => {
    if (!currentScene) return
    await SceneService.update(currentScene.id, { content })
  },
  delay: 2000, // Debounce 2s
  onError: error => {
    toast.error('Auto-save failed: ' + error.message)
  },
})
```

---

### 3. **⚠️ HIGH: Progressive Disclosure Failure**

**Issue:** Editor shows **ALL features simultaneously** - overwhelming for new users.

**Current Experience:**

```
New User Opens Editor:
┌────────────────────────────────────────────────────┐
│ [20 toolbar buttons] [Dropdown] [More buttons]     │ ← Toolbar overload
├────────────────────────────────────────────────────┤
│ [Chapter Sidebar] │ [Editor] │ [AI Panel]         │ ← 3 panels at once
├────────────────────────────────────────────────────┤
│ [AI Assistant] [Research] [Describe] [Brainstorm] │ ← 5 more buttons
│ [Critique] [585 words]                             │
└────────────────────────────────────────────────────┘

Result: User paralyzed, doesn't know where to start!
```

**Should Be:**

```
New User (First Time):
┌────────────────────────────────────────────────────┐
│ [Back] My Manuscript (0 words)           [Save]    │ ← Minimal top bar
├────────────────────────────────────────────────────┤
│                                                     │
│         📝 Welcome to Your Writing Space!          │
│                                                     │
│    Start typing to write your first scene...       │
│                                                     │
│         [✓] Basic formatting available             │
│         [?] Click here for AI assistance           │
│                                                     │
└────────────────────────────────────────────────────┘

Progressive disclosure: Features appear as user needs them!
```

**Impact:** MEDIUM-HIGH - Poor onboarding, feature discovery

**Recommendation:** Implement **3-tier disclosure strategy** (detailed below)

---

## 📊 Progressive Disclosure Analysis

### **Current State: Everything at Once**

#### Tier 0 (Always Visible - Currently 30+ elements):

- Top toolbar: 8 buttons + manuscript title
- Left sidebar: Chapter/scene navigation
- Right sidebar: AI assistant (optional)
- Bottom toolbar: 5 AI action buttons
- Rich text editor toolbar: 20+ formatting buttons
- **Total: 40+ UI elements visible immediately**

#### Problems:

1. **Cognitive overload** - Users can't process 40+ options
2. **Feature blindness** - Important features hidden in noise
3. **No guided discovery** - Users don't know what's possible
4. **Overwhelming for beginners** - No clear starting point

---

### **Recommended: 3-Tier Progressive Disclosure**

#### **Tier 1: Essential (First-Time Users)**

Show ONLY:

```
┌─────────────────────────────────────────┐
│ [← Back] Manuscript Title    [💾 Save]  │
├─────────────────────────────────────────┤
│                                          │
│  [Simple editor with basic formatting]  │
│                                          │
│  Features:                               │
│  - Bold, Italic, Underline (inline)     │
│  - Auto-save indicator                  │
│  - Word count                           │
│  - [✨ Try AI Help] tooltip button      │
│                                          │
└─────────────────────────────────────────┘
```

**Goal:** Get user writing ASAP, not learning UI

#### **Tier 2: Progressive (After 100 words)**

Reveal:

```
New UI elements appear:
┌─────────────────────────────────────────┐
│ ... existing ...    [💡 Tip] [⚙️ More] │ ← New options
├─────────────────────────────────────────┤
│ [📁 Chapters] │ Editor │ [✨ AI]       │ ← Unlock panels
│   (appears)   │        │  (animated)    │
├─────────────────────────────────────────┤
│ Bottom AI toolbar (fades in)            │
└─────────────────────────────────────────┘

Tooltip: "You're writing! Here are more features..."
```

#### **Tier 3: Advanced (User-Triggered)**

Show on demand:

- Story Bible (button in toolbar)
- Analytics (dropdown menu)
- Version History (when user saves)
- Export options (dropdown menu)
- Advanced formatting (expandable toolbar section)

---

## 🐛 Moderate Issues

### 4. **Scene Switching UX**

**Location:** `EditorWorkspace.tsx:290-292`

**Issue:**

```typescript
const handleSelectScene = (scene: Scene) => {
  setCurrentScene(scene) // Instant switch - no save prompt!
}
```

**Problem:** Switching scenes doesn't prompt to save current scene

**Impact:** MEDIUM - Potential data loss

**Fix:**

```typescript
const handleSelectScene = async (scene: Scene) => {
  // Check if current scene has unsaved changes
  if (currentScene && hasUnsavedChanges(currentScene)) {
    const confirmed = await showDialog({
      title: 'Unsaved Changes',
      message: 'Save changes before switching scenes?',
      buttons: ['Save & Switch', 'Discard', 'Cancel'],
    })

    if (confirmed === 'Cancel') return
    if (confirmed === 'Save & Switch') await handleManualSave()
  }

  setCurrentScene(scene)
}
```

---

### 5. **AI Assistant Panel: No Context Awareness**

**Location:** `components/AIAssistantPanel.tsx:116-128`

**Issue:**

```typescript
const handleExpand = () => {
  if (!contextBefore && !selectedText) {
    setError('No context provided.') // Generic error
    return
  }

  callAI('expand', {
    contextBefore: contextBefore || selectedText,
    length: expandLength,
  })
}
```

**Problems:**

1. Doesn't explain **what** context is needed
2. No example or guidance
3. Doesn't suggest **how** to fix it

**Impact:** MEDIUM - Confusing for users

**Fix:**

```typescript
const handleExpand = () => {
  if (!contextBefore && !selectedText) {
    setError(
      <div>
        <p>AI needs context to expand your story.</p>
        <p className="text-sm mt-2">
          <strong>How to fix:</strong>
          <ul className="list-disc list-inside mt-1">
            <li>Write at least one sentence first</li>
            <li>Or select existing text to expand from</li>
          </ul>
        </p>
      </div>
    )
    return
  }
  // ... rest
}
```

---

### 6. **Bottom Toolbar Buttons Don't Work**

**Location:** `EditorWorkspace.tsx:583-594`

**Issue:**

```typescript
<Button variant="ghost" size="sm" className="gap-2">
  <Wand2 className="h-4 w-4" />
  Describe
</Button>
{/* No onClick handler! */}
```

**Problem:** 4 out of 5 buttons in bottom toolbar have no functionality

**Impact:** MEDIUM - Broken features, user confusion

**Fix:**

```typescript
<Button
  variant="ghost"
  size="sm"
  className="gap-2"
  onClick={() => {
    setSidePanel('ai-assistant')
    setActiveAIFeature('describe') // Need to add this state
  }}
>
  <Wand2 className="h-4 w-4" />
  Describe
</Button>
```

---

## ⚡ Performance Issues

### 7. **Redundant Scene Loads**

**Location:** `EditorWorkspace.tsx:143-155, ChapterSidebar.tsx:54-74`

**Issue:** Scenes are loaded **twice** for every chapter:

1. `EditorWorkspace.loadChapterScenes()`
2. `ChapterSidebar.loadChapters()` (loads scenes for ALL chapters)

**Impact:** MEDIUM - Slow initial load, wasted API calls

**Fix:** Lift scene state management to workspace, pass down as props

---

### 8. **No Virtualization for Long Documents**

**Issue:** TipTap editor renders entire manuscript in DOM

**Impact:** LOW-MEDIUM - Slow with 50,000+ word manuscripts

**Recommendation:** Implement scene-based virtualization (only render current + prev/next scenes)

---

## ♿ Accessibility Issues

### 9. **No Keyboard Shortcuts**

**Issue:** Users can't navigate editor with keyboard

**Missing:**

- `Cmd/Ctrl+S` - Save
- `Cmd/Ctrl+K` - Open AI assistant
- `Cmd/Ctrl+/` - Toggle focus mode
- `Cmd/Ctrl+B/I/U` - Formatting (TipTap has these, but not documented)

**Impact:** MEDIUM - Poor power user experience

**Fix:** Add keyboard shortcut guide + implement global shortcuts

---

### 10. **Missing ARIA Labels**

**Issue:** Screen readers can't navigate effectively

**Examples:**

```typescript
<Button variant="ghost" size="sm" onClick={toggleAIAssistant}>
  <Sparkles className="h-4 w-4" />
  {/* No aria-label for icon-only state */}
</Button>
```

**Impact:** LOW-MEDIUM - Inaccessible to screen reader users

---

## 💡 Improvement Recommendations

### **Priority 1: Progressive Disclosure (HIGH IMPACT)**

**Implement Onboarding Flow:**

```typescript
// src/hooks/useEditorOnboarding.ts
export function useEditorOnboarding() {
  const [stage, setStage] = useState<'beginner' | 'intermediate' | 'advanced'>()

  // Detect user level based on:
  // - Word count in manuscript
  // - Features used
  // - Time spent in editor

  return {
    showFeature: (feature: string) => {
      if (stage === 'beginner') return ['write', 'save', 'format'].includes(feature)
      if (stage === 'intermediate') return true // Show all
      return true
    },
    unlockFeature: (feature: string) => {
      // Show celebration tooltip when feature unlocks
    },
  }
}
```

**Usage:**

```typescript
const { showFeature } = useEditorOnboarding()

{showFeature('ai-assistant') && (
  <Button onClick={toggleAIAssistant}>
    <Sparkles /> AI Assistant
    {justUnlocked && <Badge>New!</Badge>}
  </Button>
)}
```

---

### **Priority 2: Improve Error Handling**

**Create Error Boundary:**

```typescript
// src/components/EditorErrorBoundary.tsx (ALREADY EXISTS!)
// Just need to use it properly:

<EditorErrorBoundary>
  <EditorWorkspace {...props} />
</EditorErrorBoundary>
```

**Add Error Recovery:**

```typescript
// For every async operation, add recovery:
try {
  await operation()
} catch (error) {
  logger.error(...)
  showErrorDialog({
    title: 'Operation Failed',
    message: error.message,
    actions: [
      { label: 'Retry', onClick: () => operation() },
      { label: 'Cancel', onClick: () => {} }
    ]
  })
}
```

---

### **Priority 3: Add Keyboard Shortcuts**

```typescript
// src/hooks/useEditorShortcuts.ts
export function useEditorShortcuts(editor, actions) {
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey

      if (isMod && e.key === 's') {
        e.preventDefault()
        actions.save()
      }
      if (isMod && e.key === 'k') {
        e.preventDefault()
        actions.toggleAI()
      }
      if (isMod && e.key === '/') {
        e.preventDefault()
        actions.toggleFocusMode()
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [actions])
}
```

---

### **Priority 4: Add Contextual Help**

**Implement Tooltips + Hints:**

```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <Button onClick={toggleAIAssistant}>
      <Sparkles /> AI Assistant
    </Button>
  </TooltipTrigger>
  <TooltipContent side="bottom">
    <p>Get AI help with writing</p>
    <kbd className="text-xs">Cmd+K</kbd>
  </TooltipContent>
</Tooltip>
```

**Add Contextual Empty States:**

```typescript
{scenes.length === 0 && (
  <div className="text-center p-8 border-2 border-dashed rounded-lg">
    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
    <h3 className="mt-4 font-semibold">No Scenes Yet</h3>
    <p className="text-sm text-muted-foreground mt-2">
      Scenes help organize your chapter into manageable sections.
    </p>
    <Button className="mt-4" onClick={handleCreateScene}>
      <Plus className="mr-2 h-4 w-4" />
      Create Your First Scene
    </Button>
  </div>
)}
```

---

## 📋 Recommended Implementation Plan

### **Phase 1: Fix Critical Issues (Week 1)**

- [ ] Add error recovery UI for manuscript loading
- [ ] Fix auto-save race conditions
- [ ] Add unsaved changes prompt on scene switch
- [ ] Wire up bottom toolbar buttons

### **Phase 2: Progressive Disclosure (Week 2-3)**

- [ ] Implement 3-tier disclosure system
- [ ] Add onboarding flow for new users
- [ ] Create feature unlock animations
- [ ] Add tooltips and help hints

### **Phase 3: Polish (Week 4)**

- [ ] Add keyboard shortcuts
- [ ] Improve error messages
- [ ] Add contextual empty states
- [ ] Performance optimization (scene virtualization)

### **Phase 4: Accessibility (Week 5)**

- [ ] Add ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] High contrast mode support

---

## 📊 Metrics to Track

After implementing fixes, monitor:

1. **Error Rate:** % of sessions with errors (target: <5%)
2. **Feature Discovery:** % users who find AI assistant within 5 min (target: >80%)
3. **Data Loss:** Auto-save failure rate (target: <0.1%)
4. **Time to First Word:** How long before user starts writing (target: <30s)
5. **Feature Usage:** % users who use advanced features (track adoption)

---

## ✅ What's Already Good

### Strengths:

1. ✅ **Solid Architecture** - Well-separated concerns
2. ✅ **Error Logging** - Good use of logger throughout
3. ✅ **TipTap Integration** - Professional rich text editing
4. ✅ **Auto-save Concept** - Just needs fixes
5. ✅ **AI Integration** - Well-structured API calls
6. ✅ **Responsive Design** - Resizable panels work well
7. ✅ **Focus Mode** - Nice feature for distraction-free writing

---

## 🎯 Final Recommendations

### **Top 3 Must-Fix:**

1. **Add error recovery UI** - Users can't recover from failures
2. **Fix auto-save** - Data loss risk is unacceptable
3. **Implement progressive disclosure** - Onboarding is critical for adoption

### **Top 3 Nice-to-Have:**

1. Keyboard shortcuts - Power users will love this
2. Contextual help - Reduces support burden
3. Performance optimization - Future-proofing for large manuscripts

### **Don't Bother With:**

1. Complex animations - Keep it fast and simple
2. Too many view modes - Focus on core editor experience
3. Over-engineering - Ship fixes, iterate based on user feedback

---

## 📚 Resources

- **TipTap Docs:** https://tiptap.dev/docs
- **Progressive Disclosure Pattern:** Nielsen Norman Group
- **Error Handling Best Practices:** https://kentcdodds.com/blog/use-error-boundary
- **Keyboard Shortcuts Guide:** https://shortcuts.design/

---

**Next Steps:** Review with team, prioritize fixes, assign work.
