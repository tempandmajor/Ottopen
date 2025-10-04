# AI Context & Memory - Implementation Guide

## ❌ CRITICAL ISSUE IDENTIFIED

The current AI implementation has **NO memory or context** about the story. It treats each request independently, which means:

- ❌ Doesn't remember character names, traits, or backstories
- ❌ Doesn't track plot threads or continuity
- ❌ Can't catch inconsistencies (e.g., character eye color changing)
- ❌ Doesn't maintain writing style consistency
- ❌ No awareness of what happened in previous scenes

This makes the AI **useless for novel writing**!

---

## ✅ SOLUTION: AI Context Builder

Created `/src/lib/ai-context-builder.ts` - a comprehensive context system that:

### What It Does:

1. **Story Bible Integration** - Includes all characters, locations, plot threads
2. **Scene Continuity** - Remembers last 3 scenes
3. **Consistency Checking** - AI can flag contradictions
4. **Style Matching** - Maintains author's voice
5. **Smart Token Management** - Auto-trims context to fit limits

---

## 📊 Context Structure

### System Prompt (Story Bible)

```
You are an expert creative writing assistant helping to write a
fantasy manuscript titled "The Dragon's Crown".

## STORY BIBLE

### Characters

**Aria Moonwhisper** (protagonist)
- Age: 24
- Appearance: Silver hair, violet eyes, 5'6"
- Personality: Brave but impulsive, loyal to a fault
- Backstory: Orphaned at 12, raised by the Dragon Guild
- Internal Goal: Find her true identity
- External Goal: Defeat the Shadow King
- Fear: Losing those she loves

**Lord Blackthorn** (antagonist)
- Age: Unknown (appears 40s)
- Personality: Cunning, manipulative, charismatic
- Internal Goal: Achieve immortality
- Fear: Being forgotten

### Locations

**Dragon's Keep** (castle)
- Description: Ancient fortress carved into mountainside
- Atmosphere: Cold, echoing halls with dragon tapestries
- Significance: Where Aria was trained

### Plot Threads

**The Lost Heir** (main-plot)
- Status: active
- Description: Aria discovers she may be the lost princess

**Forbidden Romance** (subplot)
- Status: active
- Description: Growing feelings between Aria and Prince Kael
```

### Conversation History (Recent Scenes)

```
[Previous scene: "Training in the Courtyard"]
Aria swung her sword in a wide arc... [last 2000 chars]

[Previous scene: "The Secret Message"]
The raven arrived at midnight... [content]

[Current scene: "Confrontation at the Ball"]
[Current working content]
```

---

## 🔧 Implementation

### Step 1: Update AI API Routes

**Example: `/app/api/ai/expand/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { AIContextBuilder } from '@/src/lib/ai-context-builder'
import {
  ManuscriptService,
  CharacterService,
  LocationService,
  PlotThreadService,
  SceneService,
} from '@/src/lib/ai-editor-service'
import { aiUsageTracker } from '@/src/lib/ai-usage-tracker'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { manuscriptId, sceneId, selectedText, contextBefore, length } = await req.json()

    // 1. Load ALL story context
    const [manuscript, characters, locations, plotThreads, currentScene, recentScenes] =
      await Promise.all([
        ManuscriptService.getById(manuscriptId),
        CharacterService.getByManuscriptId(manuscriptId),
        LocationService.getByManuscriptId(manuscriptId),
        PlotThreadService.getByManuscriptId(manuscriptId),
        sceneId ? SceneService.getById(sceneId) : Promise.resolve(null),
        SceneService.getRecentScenes(manuscriptId, 3), // Get last 3 scenes
      ])

    // 2. Build comprehensive AI context
    const aiContext = AIContextBuilder.buildContext({
      manuscript,
      characters,
      locations,
      plotThreads,
      recentScenes,
      currentScene,
      userPreferences: {
        writingStyle: 'vivid and descriptive',
        pov: 'third-person limited',
        tense: 'past',
      },
    })

    // 3. Build feature-specific prompt
    const { prompt, fullContext } = AIContextBuilder.buildFeatureContext(
      'expand',
      selectedText || contextBefore,
      aiContext
    )

    // 4. Check token limits
    const estimatedTokens = AIContextBuilder.estimateTokens(fullContext)
    console.log(`Context size: ~${estimatedTokens} tokens`)

    // Trim if needed (OpenAI GPT-5: 200K, Claude 4.5: 500K)
    const trimmedContext = AIContextBuilder.trimContext(fullContext, 150000)

    // 5. Check AI usage limits
    const { allowed, reason } = await aiUsageTracker.checkLimits(user.id, 2000)
    if (!allowed) {
      return NextResponse.json({ error: reason }, { status: 429 })
    }

    // 6. Call AI (OpenAI GPT-5 example)
    const openaiPayload = AIContextBuilder.formatForOpenAI(trimmedContext, prompt)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(openaiPayload),
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()

    // 7. Record usage
    await aiUsageTracker.recordUsage(user.id, 'expand', 'openai', 'gpt-5-turbo', {
      total: data.usage.total_tokens,
      prompt: data.usage.prompt_tokens,
      completion: data.usage.completion_tokens,
    })

    // 8. Return response with metadata
    return NextResponse.json({
      content: data.choices[0].message.content,
      provider: 'openai',
      model: 'gpt-5-turbo',
      tokensUsed: {
        total: data.usage.total_tokens,
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
      },
      contextSize: estimatedTokens,
    })
  } catch (error) {
    console.error('AI expand error:', error)
    return NextResponse.json({ error: 'Failed to generate expansion' }, { status: 500 })
  }
}
```

---

### Step 2: Add Scene History Query

**Add to `/src/lib/ai-editor-service.ts`:**

```typescript
export class SceneService {
  // ... existing methods ...

  /**
   * Get recent scenes for AI context
   */
  static async getRecentScenes(manuscriptId: string, limit: number = 3): Promise<Scene[]> {
    const supabase = createClientComponentClient()

    // Get all chapters for the manuscript
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id')
      .eq('manuscript_id', manuscriptId)
      .order('order_index', { ascending: true })

    if (!chapters) return []

    const chapterIds = chapters.map(c => c.id)

    // Get recent scenes
    const { data: scenes, error } = await supabase
      .from('scenes')
      .select('*')
      .in('chapter_id', chapterIds)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Return in chronological order (oldest first)
    return (scenes || []).reverse()
  }
}
```

---

## 🔄 Anthropic Claude 4.5 Alternative

For Claude 4.5 (best for long-form fiction with extended context):

```typescript
// Instead of OpenAI format, use:
const claudePayload = AIContextBuilder.formatForAnthropic(trimmedContext, prompt)

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify(claudePayload),
})

const data = await response.json()

return NextResponse.json({
  content: data.content[0].text,
  provider: 'anthropic',
  model: 'claude-4.5-sonnet',
  tokensUsed: {
    total: data.usage.input_tokens + data.usage.output_tokens,
    prompt: data.usage.input_tokens,
    completion: data.usage.output_tokens,
  },
})
```

---

## 🎯 Example: What The AI Now Knows

### Before (Current):

```
User: "Expand this: Aria walked into the room."

AI: "Aria walked into the spacious room. It had white walls
and a large window. She looked around."
```

**Problem:** Generic, no story context

### After (With Context):

```
User: "Expand this: Aria walked into the room."

AI: "Aria walked into the throne room of Dragon's Keep, her
boots echoing on the ancient stone floor. The familiar scent
of incense and old tapestries brought back memories of her
training days. Her silver hair caught the torchlight as she
scanned the chamber, violet eyes searching for any sign of
Lord Blackthorn. After the secret message from the raven,
she knew he would be here—and this time, she was ready."
```

**Improvement:**

- ✅ Uses character details (silver hair, violet eyes)
- ✅ References established location (Dragon's Keep)
- ✅ Maintains continuity (the raven message from previous scene)
- ✅ Includes antagonist relationship
- ✅ Matches writing style

---

## 🔍 AI Can Now Catch Errors!

### Example Critique:

```
User: [Submits scene where Aria has brown eyes]

AI Response: "⚠️ CONTINUITY ERROR DETECTED

In your story bible, Aria is described as having violet eyes,
but in this scene, you mention her 'brown eyes reflecting the
firelight.'

Suggested fix: Change to 'violet eyes' to maintain consistency.

Other observations:
- Great use of the Dragon's Keep atmosphere
- Dialogue feels authentic to Aria's brave personality
- Nice callback to her training in the previous scene"
```

---

## 📊 Token Management

### Context Size Estimates:

- **Small novel** (5 characters, 3 locations): ~5K tokens
- **Medium novel** (15 characters, 10 locations): ~15K tokens
- **Large epic** (30+ characters, 20+ locations): ~30K tokens
- **Recent scenes** (3 scenes): ~3-6K tokens

### Total: ~10-40K tokens per request

### API Limits:

- **OpenAI GPT-5 Turbo**: 200K context window ✅✅
- **Claude 4.5 Sonnet**: 500K context window ✅✅✅
- **Claude 4.5 Opus**: 500K context window (highest quality) ✅✅✅

**Recommendation:** Use Claude 4.5 Sonnet for cost-effective long-form fiction with massive context

---

## 🚀 Next Steps

### 1. Create AI API Routes (Required)

```bash
app/api/ai/
  ├── expand/route.ts       ← Create with context
  ├── rewrite/route.ts      ← Create with context
  ├── describe/route.ts     ← Create with context
  ├── brainstorm/route.ts   ← Create with context
  ├── critique/route.ts     ← Create with context (most important!)
  └── continue/route.ts     ← Create with context
```

### 2. Update AIAssistantPanel

```typescript
// Add context loading
const [contextLoading, setContextLoading] = useState(false)

useEffect(() => {
  // Pre-load context when panel opens
  loadStoryContext()
}, [])
```

### 3. Add Context Indicator in UI

```typescript
<Badge variant="outline" className="text-xs">
  Context: {characters.length} chars, {locations.length} places,
  {plotThreads.length} threads
</Badge>
```

### 4. Environment Variables

```bash
# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Choose provider
AI_PROVIDER=anthropic  # or 'openai'
AI_MODEL=claude-4.5-sonnet-20250101  # or 'gpt-5-turbo'
```

---

## 💰 Cost Comparison

### OpenAI GPT-5 Turbo:

- Input: $5 / 1M tokens
- Output: $15 / 1M tokens
- **Per request** (40K context + 2K completion): $0.23

### Anthropic Claude 4.5 Sonnet:

- Input: $2 / 1M tokens
- Output: $10 / 1M tokens
- **Per request** (40K context + 2K completion): $0.10

### Anthropic Claude 4.5 Opus (highest quality):

- Input: $10 / 1M tokens
- Output: $50 / 1M tokens
- **Per request**: $0.50

**Recommendation:** Claude 4.5 Sonnet = Best balance of quality and cost for novels with 500K context window

---

## ✅ Implementation Checklist

- [ ] Set up OpenAI or Anthropic API keys
- [ ] Add `getRecentScenes()` method to SceneService
- [ ] Create all 6 AI API routes with context
- [ ] Update AIAssistantPanel to load story data
- [ ] Add context size indicator in UI
- [ ] Test with actual novel content
- [ ] Verify continuity checking works
- [ ] Monitor token usage and costs

---

## 📝 Example Usage in Component

```typescript
import { useAIContext, AIContextBuilder } from '@/src/lib/ai-context-builder'

function AIAssistantPanel({ manuscriptId, sceneId }) {
  // Load story data
  const { manuscript, characters, locations, plotThreads, currentScene } = useStoryData(
    manuscriptId,
    sceneId
  )

  // Build context
  const aiContext = useAIContext({
    manuscript,
    characters,
    locations,
    plotThreads,
    currentScene,
  })

  const handleExpand = async () => {
    const res = await fetch('/api/ai/expand', {
      method: 'POST',
      body: JSON.stringify({
        manuscriptId,
        sceneId,
        selectedText,
        // Context is loaded server-side from these IDs
      }),
    })
  }
}
```

---

## 🎓 Key Benefits

1. **Consistency**: AI knows all character details, never forgets
2. **Continuity**: References previous scenes, maintains plot threads
3. **Error Detection**: Catches contradictions automatically
4. **Style Matching**: Learns and maintains author's voice
5. **Smart Suggestions**: Ideas fit the established story world
6. **Time Saving**: No need to remind AI of character details each time

---

**Status:** ⚠️ **CRITICAL FEATURE - MUST IMPLEMENT**

Without this, the AI editor is just a glorified autocomplete. With this, it becomes a true writing partner that understands your novel!
