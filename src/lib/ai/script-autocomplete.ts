// AI-Powered Screenplay Autocomplete
// Context-aware suggestions for dialogue, action, and scene elements

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export interface AutocompleteContext {
  currentLine: string
  previousLines: string[]
  elementType: 'dialogue' | 'action' | 'scene_heading' | 'character' | 'transition'
  characterName?: string
  sceneContext?: string
  genre?: string
}

export interface AutocompleteSuggestion {
  text: string
  confidence: number
  reasoning?: string
}

export class ScriptAutocomplete {
  private anthropic: Anthropic | null = null
  private openai: OpenAI | null = null
  private provider: 'anthropic' | 'openai'

  constructor() {
    this.provider = (process.env.AI_PROVIDER as 'anthropic' | 'openai') || 'anthropic'

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    }

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }
  }

  async getSuggestions(context: AutocompleteContext): Promise<AutocompleteSuggestion[]> {
    const prompt = this.buildPrompt(context)

    if (this.provider === 'anthropic' && this.anthropic) {
      return this.getAnthropicSuggestions(prompt, context)
    } else if (this.openai) {
      return this.getOpenAISuggestions(prompt, context)
    }

    return []
  }

  private buildPrompt(context: AutocompleteContext): string {
    const { currentLine, previousLines, elementType, characterName, sceneContext } = context

    let prompt = `You are an expert screenwriter assistant providing autocomplete suggestions.

Scene Context: ${sceneContext || 'Unknown'}
Element Type: ${elementType}
${characterName ? `Character: ${characterName}` : ''}

Previous lines:
${previousLines.slice(-5).join('\n')}

Current incomplete line: "${currentLine}"

Provide 3 natural, screenplay-appropriate completions for this line. Consider:
- Screenplay formatting conventions
- Character voice consistency
- Scene context and momentum
- Genre expectations${context.genre ? ` (${context.genre})` : ''}

Return ONLY the completion text for each suggestion, one per line.`

    return prompt
  }

  private async getAnthropicSuggestions(
    prompt: string,
    context: AutocompleteContext
  ): Promise<AutocompleteSuggestion[]> {
    if (!this.anthropic) return []

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const content = response.content[0]
      if (content.type !== 'text') return []

      return this.parseSuggestions(content.text, context.currentLine)
    } catch (error) {
      console.error('Anthropic autocomplete error:', error)
      return []
    }
  }

  private async getOpenAISuggestions(
    prompt: string,
    context: AutocompleteContext
  ): Promise<AutocompleteSuggestion[]> {
    if (!this.openai) return []

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
        n: 3,
      })

      const suggestions = response.choices.map(choice => ({
        text: choice.message.content?.trim() || '',
        confidence: 0.8,
      }))

      return suggestions.filter(s => s.text.length > 0)
    } catch (error) {
      console.error('OpenAI autocomplete error:', error)
      return []
    }
  }

  private parseSuggestions(text: string, currentLine: string): AutocompleteSuggestion[] {
    const lines = text.split('\n').filter(line => line.trim())

    return lines.slice(0, 3).map((line, index) => ({
      text: currentLine + line.trim(),
      confidence: 0.9 - index * 0.1,
    }))
  }

  // Quick suggestions without AI (for instant feedback)
  getQuickSuggestions(context: AutocompleteContext): AutocompleteSuggestion[] {
    const { elementType, currentLine } = context

    if (elementType === 'scene_heading') {
      return this.getSceneHeadingSuggestions(currentLine)
    } else if (elementType === 'transition') {
      return this.getTransitionSuggestions(currentLine)
    } else if (elementType === 'character') {
      return this.getCharacterSuggestions(currentLine, context)
    }

    return []
  }

  private getSceneHeadingSuggestions(currentLine: string): AutocompleteSuggestion[] {
    const suggestions: AutocompleteSuggestion[] = []

    if (currentLine.toUpperCase().startsWith('INT')) {
      suggestions.push(
        { text: 'INT. COFFEE SHOP - DAY', confidence: 1.0 },
        { text: 'INT. APARTMENT - NIGHT', confidence: 1.0 },
        { text: 'INT. OFFICE - DAY', confidence: 1.0 }
      )
    } else if (currentLine.toUpperCase().startsWith('EXT')) {
      suggestions.push(
        { text: 'EXT. STREET - DAY', confidence: 1.0 },
        { text: 'EXT. PARK - NIGHT', confidence: 1.0 },
        { text: 'EXT. BUILDING - DAY', confidence: 1.0 }
      )
    }

    return suggestions
  }

  private getTransitionSuggestions(currentLine: string): AutocompleteSuggestion[] {
    const transitions = [
      'CUT TO:',
      'FADE TO:',
      'DISSOLVE TO:',
      'SMASH CUT TO:',
      'MATCH CUT TO:',
      'FADE OUT.',
      'THE END',
    ]

    return transitions
      .filter(t => t.toLowerCase().startsWith(currentLine.toLowerCase()))
      .map(text => ({ text, confidence: 1.0 }))
  }

  private getCharacterSuggestions(
    currentLine: string,
    context: AutocompleteContext
  ): AutocompleteSuggestion[] {
    const suggestions: AutocompleteSuggestion[] = []

    // Extract character names from previous lines
    const characterNames = new Set<string>()
    context.previousLines.forEach(line => {
      const trimmed = line.trim()
      if (/^[A-Z\s\(\)]+$/.test(trimmed) && trimmed.length < 40) {
        characterNames.add(trimmed)
      }
    })

    // Filter by current input
    const matches = Array.from(characterNames).filter(name =>
      name.startsWith(currentLine.toUpperCase())
    )

    return matches.map(text => ({ text, confidence: 1.0 }))
  }
}

// Singleton instance
export const scriptAutocomplete = new ScriptAutocomplete()
