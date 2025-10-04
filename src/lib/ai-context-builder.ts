/**
 * AI Context Builder
 * Builds comprehensive context for AI requests including:
 * - Story bible (characters, locations, plot threads)
 * - Recent scenes for continuity
 * - Manuscript metadata
 * - Writing style preferences
 */

import type {
  Manuscript,
  Character,
  Location,
  PlotThread,
  Scene,
  Chapter,
} from '@/src/types/ai-editor'

interface AIContext {
  systemPrompt: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  metadata: {
    manuscriptTitle: string
    genre?: string
    targetWordCount?: number
    currentWordCount: number
  }
}

export class AIContextBuilder {
  /**
   * Build comprehensive context for AI requests
   */
  static buildContext(params: {
    manuscript: Manuscript
    characters: Character[]
    locations: Location[]
    plotThreads: PlotThread[]
    recentScenes?: Scene[]
    currentScene?: Scene
    userPreferences?: {
      writingStyle?: string
      pov?: string
      tense?: string
    }
  }): AIContext {
    const {
      manuscript,
      characters,
      locations,
      plotThreads,
      recentScenes = [],
      currentScene,
      userPreferences = {},
    } = params

    // Build system prompt with full story context
    const systemPrompt = this.buildSystemPrompt(
      manuscript,
      characters,
      locations,
      plotThreads,
      userPreferences
    )

    // Build conversation history from recent scenes
    const conversationHistory = this.buildConversationHistory(recentScenes, currentScene)

    return {
      systemPrompt,
      conversationHistory,
      metadata: {
        manuscriptTitle: manuscript.title,
        genre: manuscript.genre,
        targetWordCount: manuscript.target_word_count,
        currentWordCount: manuscript.current_word_count,
      },
    }
  }

  /**
   * Build comprehensive system prompt with story bible
   */
  private static buildSystemPrompt(
    manuscript: Manuscript,
    characters: Character[],
    locations: Location[],
    plotThreads: PlotThread[],
    userPreferences: any
  ): string {
    let prompt = `You are an expert creative writing assistant helping to write a ${manuscript.genre || 'fiction'} manuscript titled "${manuscript.title}".

Your role is to:
1. Maintain consistency with established characters, locations, and plot threads
2. Match the author's writing style and voice
3. Flag any inconsistencies or continuity errors
4. Provide creative suggestions that fit the story world
5. Remember all details about the story and reference them accurately

---

## STORY BIBLE

### Manuscript Details
- Title: ${manuscript.title}
- Genre: ${manuscript.genre || 'Not specified'}
- Target Length: ${manuscript.target_word_count?.toLocaleString() || 'Not set'} words
- Current Progress: ${manuscript.current_word_count.toLocaleString()} words (${manuscript.target_word_count ? Math.round((manuscript.current_word_count / manuscript.target_word_count) * 100) : 0}%)
- Status: ${manuscript.status}
`

    // Characters
    if (characters.length > 0) {
      prompt += `\n### Characters\n\n`
      characters.forEach(char => {
        prompt += `**${char.name}** (${char.role})\n`
        if (char.age) prompt += `- Age: ${char.age}\n`
        if (char.gender) prompt += `- Gender: ${char.gender}\n`
        if (char.appearance) prompt += `- Appearance: ${char.appearance}\n`
        if (char.personality_summary) prompt += `- Personality: ${char.personality_summary}\n`
        if (char.formative_events) prompt += `- Backstory: ${char.formative_events}\n`
        if (char.internal_goal) prompt += `- Internal Goal: ${char.internal_goal}\n`
        if (char.external_goal) prompt += `- External Goal: ${char.external_goal}\n`
        if (char.fear) prompt += `- Fear/Weakness: ${char.fear}\n`
        prompt += `\n`
      })
    }

    // Locations
    if (locations.length > 0) {
      prompt += `### Locations\n\n`
      locations.forEach(loc => {
        prompt += `**${loc.name}** (${loc.type})\n`
        if (loc.description) prompt += `- Description: ${loc.description}\n`
        if (loc.atmosphere) prompt += `- Atmosphere: ${loc.atmosphere}\n`
        if (loc.significance) prompt += `- Story Significance: ${loc.significance}\n`
        prompt += `\n`
      })
    }

    // Plot Threads
    if (plotThreads.length > 0) {
      prompt += `### Plot Threads\n\n`
      plotThreads.forEach(plot => {
        prompt += `**${plot.title}** (${plot.type})\n`
        prompt += `- Status: ${plot.status}\n`
        if (plot.description) prompt += `- Description: ${plot.description}\n`
        prompt += `\n`
      })
    }

    // Writing preferences
    if (userPreferences.writingStyle || userPreferences.pov || userPreferences.tense) {
      prompt += `### Writing Style Guidelines\n\n`
      if (userPreferences.writingStyle) prompt += `- Style: ${userPreferences.writingStyle}\n`
      if (userPreferences.pov) prompt += `- Point of View: ${userPreferences.pov}\n`
      if (userPreferences.tense) prompt += `- Tense: ${userPreferences.tense}\n`
      prompt += `\n`
    }

    prompt += `---

**IMPORTANT INSTRUCTIONS:**
- Always reference the story bible above when making suggestions
- Flag any inconsistencies with established characters, locations, or plot
- Maintain the established writing style and tone
- When suggesting character actions, stay true to their personality and goals
- Reference previous events when relevant
- Keep track of what has happened in the story so far
`

    return prompt
  }

  /**
   * Build conversation history from recent scenes
   * This provides immediate context of what just happened
   */
  private static buildConversationHistory(
    recentScenes: Scene[],
    currentScene?: Scene
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = []

    // Add last 3 scenes as context (to stay within token limits)
    const scenesToInclude = recentScenes.slice(-3)

    scenesToInclude.forEach((scene, idx) => {
      // Strip HTML and get plain text
      const plainText = scene.content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()

      if (plainText) {
        // Add as user message (what was written)
        history.push({
          role: 'user',
          content: `[Previous scene: "${scene.title || 'Untitled'}"]\n\n${plainText.substring(0, 2000)}${plainText.length > 2000 ? '...' : ''}`,
        })
      }
    })

    // Add current scene if different from last recent scene
    if (currentScene && !scenesToInclude.find(s => s.id === currentScene.id)) {
      const plainText = currentScene.content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()

      if (plainText) {
        history.push({
          role: 'user',
          content: `[Current scene: "${currentScene.title || 'Untitled'}"]\n\n${plainText}`,
        })
      }
    }

    return history
  }

  /**
   * Build context for specific AI features
   */
  static buildFeatureContext(
    feature: string,
    selectedText: string,
    baseContext: AIContext
  ): { prompt: string; fullContext: AIContext } {
    let featurePrompt = ''

    switch (feature) {
      case 'expand':
        featurePrompt = `Expand the following text while maintaining consistency with the story bible and established character voices. Add vivid details, dialogue, or action as appropriate:\n\n"${selectedText}"`
        break

      case 'rewrite':
        featurePrompt = `Rewrite the following text to be more vivid and engaging, while maintaining consistency with the story bible and character voices:\n\n"${selectedText}"`
        break

      case 'describe':
        featurePrompt = `Provide a rich, sensory description of the following, consistent with the story world and atmosphere:\n\n"${selectedText}"`
        break

      case 'brainstorm':
        featurePrompt = `Based on the current story context and plot threads, brainstorm creative ideas for what could happen next with: ${selectedText}`
        break

      case 'critique':
        featurePrompt = `Review the following text for:\n1. Consistency with established characters and story bible\n2. Plot continuity and logic\n3. Character voice authenticity\n4. Pacing and engagement\n5. Any factual or timeline errors\n\nText:\n"${selectedText}"`
        break

      case 'continue':
        featurePrompt = `Continue the story from where it left off, maintaining consistency with all established characters, plot threads, and writing style.`
        break

      default:
        featurePrompt = selectedText
    }

    return {
      prompt: featurePrompt,
      fullContext: baseContext,
    }
  }

  /**
   * Check if context is getting too large (token estimation)
   */
  static estimateTokens(context: AIContext): number {
    // Rough estimation: 1 token ≈ 4 characters
    const systemTokens = Math.ceil(context.systemPrompt.length / 4)
    const historyTokens = context.conversationHistory.reduce(
      (sum, msg) => sum + Math.ceil(msg.content.length / 4),
      0
    )

    return systemTokens + historyTokens
  }

  /**
   * Trim context to fit within token limit
   */
  static trimContext(context: AIContext, maxTokens: number = 100000): AIContext {
    const currentTokens = this.estimateTokens(context)

    if (currentTokens <= maxTokens) {
      return context
    }

    // Remove oldest conversation history first
    const trimmedHistory = [...context.conversationHistory]
    while (
      this.estimateTokens({ ...context, conversationHistory: trimmedHistory }) > maxTokens &&
      trimmedHistory.length > 1
    ) {
      trimmedHistory.shift() // Remove oldest message
    }

    return {
      ...context,
      conversationHistory: trimmedHistory,
    }
  }

  /**
   * Format context for OpenAI Responses API (GPT-5)
   */
  static formatForOpenAI(context: AIContext, userPrompt: string) {
    return {
      model: 'gpt-5-turbo',
      messages: [
        { role: 'system', content: context.systemPrompt },
        ...context.conversationHistory,
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'text' },
    }
  }

  /**
   * Format context for Anthropic Claude API (Claude 4.5)
   */
  static formatForAnthropic(context: AIContext, userPrompt: string) {
    // Combine conversation history into context
    const conversationContext = context.conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Previous content' : 'AI response'}: ${msg.content}`)
      .join('\n\n')

    return {
      model: 'claude-4.5-sonnet-20250101', // or claude-4.5-opus for highest quality
      max_tokens: 8192,
      system: context.systemPrompt,
      messages: [
        {
          role: 'user',
          content: conversationContext
            ? `${conversationContext}\n\n---\n\n${userPrompt}`
            : userPrompt,
        },
      ],
    }
  }
}

/**
 * Hook to use AI context in components
 */
export function useAIContext(params: {
  manuscript: Manuscript | null
  characters: Character[]
  locations: Location[]
  plotThreads: PlotThread[]
  recentScenes?: Scene[]
  currentScene?: Scene
}) {
  if (!params.manuscript) {
    return null
  }

  return AIContextBuilder.buildContext({
    ...params,
    manuscript: params.manuscript,
  })
}
