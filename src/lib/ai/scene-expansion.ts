// AI Scene Expansion & Pacing Analysis
// Expand brief scene outlines into full screenplay scenes

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export interface SceneExpansionRequest {
  sceneOutline: string
  characterNames: string[]
  sceneContext: string
  targetLength: 'brief' | 'standard' | 'detailed' // 1/2 page, 1 page, 2+ pages
  tone: 'dramatic' | 'comedic' | 'action' | 'suspense' | 'romantic'
  genre: string
}

export interface ExpandedScene {
  sceneHeading: string
  action: string[]
  dialogue: Array<{
    character: string
    parenthetical?: string
    lines: string[]
  }>
  estimatedPageCount: number
  pacingNotes: string[]
}

export interface PacingAnalysis {
  overallPace: 'slow' | 'medium' | 'fast'
  sceneBreakdown: Array<{
    sceneNumber: number
    pageCount: number
    intensity: number // 1-10
    purposes: string[]
    suggestions: string[]
  }>
  actStructure: {
    act1Pages: number
    act2Pages: number
    act3Pages: number
    recommended: {
      act1: number
      act2: number
      act3: number
    }
  }
  pacingSuggestions: string[]
}

export class SceneExpander {
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

  async expandScene(request: SceneExpansionRequest): Promise<ExpandedScene> {
    const prompt = this.buildExpansionPrompt(request)

    if (this.provider === 'anthropic' && this.anthropic) {
      return this.expandWithAnthropic(prompt, request)
    } else if (this.openai) {
      return this.expandWithOpenAI(prompt, request)
    }

    throw new Error('No AI provider configured')
  }

  private buildExpansionPrompt(request: SceneExpansionRequest): string {
    const lengthGuide = {
      brief: '1/2 page (3-4 action lines, minimal dialogue)',
      standard: '1 page (5-8 action lines, 2-3 dialogue exchanges)',
      detailed: '2+ pages (detailed action, extended dialogue)',
    }

    return `You are an expert screenwriter. Expand this scene outline into a properly formatted screenplay scene.

SCENE OUTLINE: ${request.sceneOutline}

SCENE CONTEXT: ${request.sceneContext}

CHARACTERS AVAILABLE: ${request.characterNames.join(', ')}

REQUIREMENTS:
- Target Length: ${lengthGuide[request.targetLength]}
- Tone: ${request.tone}
- Genre: ${request.genre}
- Use proper screenplay formatting
- Show don't tell
- Include specific visual details
- Keep dialogue natural and character-driven

FORMAT YOUR RESPONSE EXACTLY AS:
SCENE HEADING: [scene heading]

ACTION:
[Action paragraph 1]

[Action paragraph 2]

CHARACTER: [character name]
DIALOGUE: [dialogue line]

CHARACTER: [character name]
PARENTHETICAL: (if needed)
DIALOGUE: [dialogue line]

...continue until scene is complete...

PACING NOTES:
- [note 1]
- [note 2]`
  }

  private async expandWithAnthropic(
    prompt: string,
    request: SceneExpansionRequest
  ): Promise<ExpandedScene> {
    if (!this.anthropic) throw new Error('Anthropic not configured')

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.8,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Invalid response type')

    return this.parseExpandedScene(content.text, request.targetLength)
  }

  private async expandWithOpenAI(
    prompt: string,
    request: SceneExpansionRequest
  ): Promise<ExpandedScene> {
    if (!this.openai) throw new Error('OpenAI not configured')

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.8,
    })

    const content = response.choices[0].message.content || ''
    return this.parseExpandedScene(content, request.targetLength)
  }

  private parseExpandedScene(text: string, targetLength: string): ExpandedScene {
    const lines = text.split('\n')
    const scene: ExpandedScene = {
      sceneHeading: '',
      action: [],
      dialogue: [],
      estimatedPageCount: targetLength === 'brief' ? 0.5 : targetLength === 'standard' ? 1 : 2,
      pacingNotes: [],
    }

    let currentSection: 'heading' | 'action' | 'dialogue' | 'notes' | null = null
    let currentCharacter: string | null = null
    let currentParenthetical: string | null = null
    let currentDialogueLines: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed.startsWith('SCENE HEADING:')) {
        scene.sceneHeading = trimmed.replace('SCENE HEADING:', '').trim()
        currentSection = 'heading'
      } else if (trimmed.startsWith('ACTION:')) {
        currentSection = 'action'
      } else if (trimmed.startsWith('CHARACTER:')) {
        if (currentCharacter && currentDialogueLines.length > 0) {
          scene.dialogue.push({
            character: currentCharacter,
            parenthetical: currentParenthetical || undefined,
            lines: currentDialogueLines,
          })
        }
        currentCharacter = trimmed.replace('CHARACTER:', '').trim()
        currentParenthetical = null
        currentDialogueLines = []
        currentSection = 'dialogue'
      } else if (trimmed.startsWith('PARENTHETICAL:')) {
        currentParenthetical = trimmed.replace('PARENTHETICAL:', '').trim()
      } else if (trimmed.startsWith('DIALOGUE:')) {
        currentDialogueLines.push(trimmed.replace('DIALOGUE:', '').trim())
      } else if (trimmed.startsWith('PACING NOTES:')) {
        currentSection = 'notes'
      } else if (trimmed.startsWith('-') && currentSection === 'notes') {
        scene.pacingNotes.push(trimmed.substring(1).trim())
      } else if (trimmed && currentSection === 'action') {
        scene.action.push(trimmed)
      } else if (trimmed && currentSection === 'dialogue') {
        currentDialogueLines.push(trimmed)
      }
    }

    // Add last dialogue if exists
    if (currentCharacter && currentDialogueLines.length > 0) {
      scene.dialogue.push({
        character: currentCharacter,
        parenthetical: currentParenthetical || undefined,
        lines: currentDialogueLines,
      })
    }

    return scene
  }

  analyzePacing(scenes: Array<{ pageCount: number; content: string }>): PacingAnalysis {
    const totalPages = scenes.reduce((sum, s) => sum + s.pageCount, 0)
    const act1End = Math.floor(totalPages * 0.25)
    const act2End = Math.floor(totalPages * 0.75)

    let act1Pages = 0
    let act2Pages = 0
    let act3Pages = 0

    const sceneBreakdown = scenes.map((scene, index) => {
      const pageCount = scene.pageCount

      if (act1Pages + pageCount <= act1End) {
        act1Pages += pageCount
      } else if (act2Pages + pageCount <= act2End - act1End) {
        act2Pages += pageCount
      } else {
        act3Pages += pageCount
      }

      return {
        sceneNumber: index + 1,
        pageCount,
        intensity: this.calculateSceneIntensity(scene.content),
        purposes: this.identifyScenePurposes(scene.content),
        suggestions: this.generateSceneSuggestions(scene.content, index, scenes.length),
      }
    })

    const avgIntensity =
      sceneBreakdown.reduce((sum, s) => sum + s.intensity, 0) / sceneBreakdown.length

    return {
      overallPace: avgIntensity < 4 ? 'slow' : avgIntensity > 7 ? 'fast' : 'medium',
      sceneBreakdown,
      actStructure: {
        act1Pages,
        act2Pages,
        act3Pages,
        recommended: {
          act1: Math.floor(totalPages * 0.25),
          act2: Math.floor(totalPages * 0.5),
          act3: Math.floor(totalPages * 0.25),
        },
      },
      pacingSuggestions: this.generatePacingSuggestions(sceneBreakdown, totalPages),
    }
  }

  private calculateSceneIntensity(content: string): number {
    let intensity = 5 // baseline

    // Action indicators
    if (/\b(runs?|fights?|crashes?|explodes?|screams?)\b/i.test(content)) intensity += 2
    if (/\b(whispers?|sits?|waits?|thinks?)\b/i.test(content)) intensity -= 1
    if (/\b(!|yells?|shouts?)\b/i.test(content)) intensity += 1

    return Math.max(1, Math.min(10, intensity))
  }

  private identifyScenePurposes(content: string): string[] {
    const purposes: string[] = []

    if (/reveal|discover|learn/i.test(content)) purposes.push('Revelation')
    if (/conflict|argue|fight/i.test(content)) purposes.push('Conflict')
    if (/character|emotion|feel/i.test(content)) purposes.push('Character Development')
    if (/plot|plan|decide/i.test(content)) purposes.push('Plot Advancement')

    return purposes.length > 0 ? purposes : ['Exposition']
  }

  private generateSceneSuggestions(content: string, index: number, total: number): string[] {
    const suggestions: string[] = []

    if (index === 0) {
      suggestions.push('Strong opening - establish tone and stakes quickly')
    }

    if (index === total - 1) {
      suggestions.push('Powerful ending - ensure emotional/thematic resonance')
    }

    if (content.length < 200) {
      suggestions.push('Consider expanding for stronger impact')
    }

    return suggestions
  }

  private generatePacingSuggestions(
    breakdown: PacingAnalysis['sceneBreakdown'],
    totalPages: number
  ): string[] {
    const suggestions: string[] = []

    const lowIntensityScenes = breakdown.filter(s => s.intensity < 4).length
    const highIntensityScenes = breakdown.filter(s => s.intensity > 7).length

    if (lowIntensityScenes > breakdown.length * 0.6) {
      suggestions.push('Consider adding more high-intensity scenes for better pacing')
    }

    if (highIntensityScenes > breakdown.length * 0.5) {
      suggestions.push('Too many high-intensity scenes - add breathing room')
    }

    if (totalPages < 90) {
      suggestions.push('Script is under typical feature length (90-120 pages)')
    } else if (totalPages > 120) {
      suggestions.push('Script exceeds typical feature length - consider trimming')
    }

    return suggestions
  }
}

export const sceneExpander = new SceneExpander()
