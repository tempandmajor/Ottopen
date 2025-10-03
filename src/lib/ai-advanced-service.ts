// Advanced AI Features Service
// Table reads, writing room perspectives, budget estimation, casting, marketing

import Anthropic from '@anthropic-ai/sdk'
import type { ScriptElement, ScriptCharacter, Script } from '@/src/types/script-editor'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface TableReadVoice {
  characterId: string
  characterName: string
  voiceId: string
  gender: 'male' | 'female' | 'neutral'
  age: 'young' | 'middle' | 'old'
  tone: string
}

export interface TableReadSegment {
  elementId: string
  characterName?: string
  content: string
  voiceId?: string
  timestamp: number
  duration: number
}

export interface WritingRoomFeedback {
  perspective: 'producer' | 'director' | 'actor' | 'editor' | 'cinematographer'
  feedbackType: 'praise' | 'concern' | 'suggestion' | 'question'
  severity: 'low' | 'medium' | 'high'
  sceneReference?: string
  pageReference?: number
  content: string
  suggestedFix?: string
}

export interface BudgetEstimation {
  estimatedBudget: {
    low: number
    mid: number
    high: number
  }
  budgetCategory: 'micro' | 'low' | 'medium' | 'high' | 'tentpole'
  breakdown: {
    castAndCrew: number
    locations: number
    production: number
    postProduction: number
    contingency: number
  }
  majorCostDrivers: Array<{
    category: string
    item: string
    estimatedCost: number
    reasoning: string
  }>
  budgetSavingTips: string[]
}

export interface CastingSuggestion {
  characterId: string
  characterName: string
  role: 'lead' | 'supporting' | 'minor'
  characterProfile: {
    age: string
    gender: string
    ethnicity?: string
    physicalDescription: string
    personality: string[]
    actingDemands: string[]
  }
  suggestedActorTypes: string[]
  similarRoles: Array<{
    actor: string
    movie: string
    year: number
    similarity: string
  }>
  castingNotes: string
}

export interface MarketingAnalysis {
  loglineStrength: number
  hookFactor: number
  genreAppeal: number
  targetAudience: {
    primaryDemographic: string
    secondaryDemographic: string
    psychographic: string
  }
  comparables: Array<{
    title: string
    year: number
    boxOffice?: number
    similarity: string
    whatWorked: string
  }>
  marketability: {
    score: number
    strengths: string[]
    weaknesses: string[]
  }
  distributionStrategy: string
  marketingHooks: string[]
  posterTaglines: string[]
}

export class AIAdvancedService {
  /**
   * Generate AI table read with voice assignments
   */
  static async generateTableRead(
    scriptId: string,
    elements: ScriptElement[],
    characters: ScriptCharacter[]
  ): Promise<{
    voiceAssignments: TableReadVoice[]
    segments: TableReadSegment[]
    totalDuration: number
  }> {
    // First, assign voices to characters based on their traits
    const voiceAssignments = await this.assignVoices(characters)

    // Generate segments with timing
    const segments: TableReadSegment[] = []
    let totalDuration = 0

    for (const element of elements) {
      if (element.element_type === 'dialogue' || element.element_type === 'action') {
        const characterName =
          element.element_type === 'dialogue'
            ? elements.find(el => el.order_index === element.order_index - 1)?.content
            : undefined

        const voiceId = characterName
          ? voiceAssignments.find(v => v.characterName === characterName)?.voiceId
          : undefined

        // Estimate duration (roughly 150 words per minute for dialogue)
        const wordCount = element.content.split(' ').length
        const duration = (wordCount / 150) * 60 // in seconds

        segments.push({
          elementId: element.id,
          characterName,
          content: element.content,
          voiceId,
          timestamp: totalDuration,
          duration,
        })

        totalDuration += duration
      }
    }

    return {
      voiceAssignments,
      segments,
      totalDuration,
    }
  }

  /**
   * Assign AI voices to characters based on their traits
   */
  private static async assignVoices(characters: ScriptCharacter[]): Promise<TableReadVoice[]> {
    const voiceAssignments: TableReadVoice[] = []

    for (const character of characters) {
      const prompt = `Based on this character description, assign appropriate voice characteristics:

Character: ${character.name}
Description: ${character.description || 'No description provided'}

Provide voice characteristics in JSON format:
{
  "gender": "male" | "female" | "neutral",
  "age": "young" | "middle" | "old",
  "tone": "description of vocal tone (e.g., 'deep and authoritative', 'soft and warm')"
}`

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      })

      const response = message.content[0].type === 'text' ? message.content[0].text : '{}'
      const voiceChar = JSON.parse(response)

      voiceAssignments.push({
        characterId: character.id,
        characterName: character.name,
        voiceId: `voice-${character.id}`,
        gender: voiceChar.gender,
        age: voiceChar.age,
        tone: voiceChar.tone,
      })
    }

    return voiceAssignments
  }

  /**
   * Generate feedback from different industry perspectives
   */
  static async generateWritingRoomFeedback(
    script: Script,
    elements: ScriptElement[],
    perspective: 'producer' | 'director' | 'actor' | 'editor' | 'cinematographer'
  ): Promise<WritingRoomFeedback[]> {
    const sceneHeadings = elements
      .filter(el => el.element_type === 'scene_heading')
      .map(el => `Page ${el.page_number}: ${el.content}`)
      .join('\n')

    const sampleDialogue = elements
      .filter(el => el.element_type === 'dialogue')
      .slice(0, 30)
      .map(el => el.content)
      .join('\n')

    const perspectives = {
      producer: {
        focus: 'budget, marketability, commercial viability, scheduling',
        concerns: 'expensive locations, large cast, complex VFX, shooting logistics',
      },
      director: {
        focus: 'visual storytelling, scene composition, filmability, pacing',
        concerns: 'unfilmable scenes, unclear blocking, weak visual moments',
      },
      actor: {
        focus: 'character motivation, emotional truth, dialogue authenticity',
        concerns: 'unclear motivations, inconsistent character, unnatural dialogue',
      },
      editor: {
        focus: 'pacing, scene transitions, narrative flow, cutting points',
        concerns: 'slow pacing, unclear transitions, scenes that drag',
      },
      cinematographer: {
        focus: 'visual style, lighting opportunities, camera movement, shot design',
        concerns: 'visually flat scenes, lighting challenges, camera restrictions',
      },
    }

    const perspectiveInfo = perspectives[perspective]

    const prompt = `You are a professional ${perspective} reviewing this screenplay.

Title: "${script.title}"
Genre: ${script.genre.join(', ')}
Page Count: ${script.page_count}

Scene Breakdown:
${sceneHeadings}

Sample Dialogue:
${sampleDialogue}

As a ${perspective}, focus on: ${perspectiveInfo.focus}
Look for: ${perspectiveInfo.concerns}

Provide 5-10 pieces of feedback in JSON format:
{
  "feedback": [
    {
      "feedbackType": "praise" | "concern" | "suggestion" | "question",
      "severity": "low" | "medium" | "high",
      "sceneReference": "scene description",
      "pageReference": page number,
      "content": "your feedback",
      "suggestedFix": "optional suggestion"
    }
  ]
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const parsed = JSON.parse(response)

    return parsed.feedback.map((fb: any) => ({
      perspective,
      ...fb,
    }))
  }

  /**
   * Estimate production budget based on script analysis
   */
  static async estimateBudget(
    script: Script,
    elements: ScriptElement[],
    characters: ScriptCharacter[]
  ): Promise<BudgetEstimation> {
    // Count locations
    const locations = new Set(
      elements
        .filter(el => el.element_type === 'scene_heading')
        .map(el => el.content.match(/(?:INT|EXT|INT\/EXT)\.\s+(.+?)\s+-/i)?.[1])
        .filter(Boolean)
    ).size

    // Count INT vs EXT
    const intCount = elements.filter(el => el.content.match(/^INT\./i)).length
    const extCount = elements.filter(el => el.content.match(/^EXT\./i)).length

    // Count VFX/action scenes
    const actionScenes = elements.filter(
      el =>
        el.element_type === 'action' &&
        /explosion|fight|chase|crash|fx|cgi|green screen/i.test(el.content)
    ).length

    const prompt = `Estimate the production budget for this screenplay:

Title: "${script.title}"
Genre: ${script.genre.join(', ')}
Page Count: ${script.page_count} pages
Locations: ${locations} unique locations
Interior Scenes: ${intCount}
Exterior Scenes: ${extCount}
Action/VFX Scenes: ${actionScenes}
Speaking Characters: ${characters.length}

Provide a detailed budget estimation in JSON format:
{
  "estimatedBudget": {
    "low": number,
    "mid": number,
    "high": number
  },
  "budgetCategory": "micro" | "low" | "medium" | "high" | "tentpole",
  "breakdown": {
    "castAndCrew": percentage,
    "locations": percentage,
    "production": percentage,
    "postProduction": percentage,
    "contingency": percentage
  },
  "majorCostDrivers": [
    {
      "category": "string",
      "item": "string",
      "estimatedCost": number,
      "reasoning": "string"
    }
  ],
  "budgetSavingTips": ["tip1", "tip2"]
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : '{}'
    return JSON.parse(response)
  }

  /**
   * Generate casting suggestions for characters
   */
  static async generateCastingSuggestions(
    script: Script,
    characters: ScriptCharacter[],
    elements: ScriptElement[]
  ): Promise<CastingSuggestion[]> {
    const suggestions: CastingSuggestion[] = []

    for (const character of characters.slice(0, 10)) {
      // Get character's dialogue for analysis
      const characterDialogue = elements
        .filter(el => {
          const prevElement = elements[elements.indexOf(el) - 1]
          return (
            el.element_type === 'dialogue' &&
            prevElement?.element_type === 'character' &&
            prevElement.content.includes(character.name)
          )
        })
        .slice(0, 10)
        .map(el => el.content)
        .join('\n')

      const prompt = `Provide casting suggestions for this character:

Script: "${script.title}"
Genre: ${script.genre.join(', ')}
Character: ${character.name}
Description: ${character.description || 'No description'}
Dialogue Count: ${character.dialogue_count}
Scene Count: ${character.scene_count}

Sample Dialogue:
${characterDialogue}

Provide casting analysis in JSON format:
{
  "role": "lead" | "supporting" | "minor",
  "characterProfile": {
    "age": "age range",
    "gender": "gender",
    "ethnicity": "if specified",
    "physicalDescription": "description",
    "personality": ["trait1", "trait2"],
    "actingDemands": ["demand1", "demand2"]
  },
  "suggestedActorTypes": ["type1", "type2"],
  "similarRoles": [
    {
      "actor": "actor name",
      "movie": "movie title",
      "year": year,
      "similarity": "why similar"
    }
  ],
  "castingNotes": "additional notes"
}`

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1536,
        messages: [{ role: 'user', content: prompt }],
      })

      const response = message.content[0].type === 'text' ? message.content[0].text : '{}'
      const parsed = JSON.parse(response)

      suggestions.push({
        characterId: character.id,
        characterName: character.name,
        ...parsed,
      })
    }

    return suggestions
  }

  /**
   * Analyze script marketability and distribution potential
   */
  static async analyzeMarketability(
    script: Script,
    elements: ScriptElement[]
  ): Promise<MarketingAnalysis> {
    const sampleContent = elements
      .filter(el => el.element_type === 'action' || el.element_type === 'dialogue')
      .slice(0, 50)
      .map(el => el.content)
      .join('\n')

    const prompt = `Analyze the marketability of this screenplay:

Title: "${script.title}"
Logline: ${script.logline || 'Not provided'}
Genre: ${script.genre.join(', ')}
Page Count: ${script.page_count}

Sample Content:
${sampleContent}

Provide comprehensive marketing analysis in JSON format:
{
  "loglineStrength": 1-10,
  "hookFactor": 1-10,
  "genreAppeal": 1-10,
  "targetAudience": {
    "primaryDemographic": "demographic",
    "secondaryDemographic": "demographic",
    "psychographic": "interests/values"
  },
  "comparables": [
    {
      "title": "movie",
      "year": year,
      "boxOffice": number,
      "similarity": "why similar",
      "whatWorked": "what worked"
    }
  ],
  "marketability": {
    "score": 1-10,
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"]
  },
  "distributionStrategy": "theatrical/streaming/both/festival",
  "marketingHooks": ["hook1", "hook2"],
  "posterTaglines": ["tagline1", "tagline2", "tagline3"]
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : '{}'
    return JSON.parse(response)
  }
}
