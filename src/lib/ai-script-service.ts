// AI Script Enhancement Service
// Provides AI-powered features for script editing

import Anthropic from '@anthropic-ai/sdk'
import type { ScriptElement, ScriptBeat, ScriptCharacter } from '@/src/types/script-editor'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface DialogueEnhancement {
  original: string
  suggestions: Array<{
    text: string
    reasoning: string
    emotion?: string
  }>
}

export interface BeatGenerationResult {
  beats: Array<{
    title: string
    description: string
    beat_type: string
    page_reference?: number
  }>
}

export interface StructureAnalysis {
  act_breakdown: {
    act1_pages: number
    act2_pages: number
    act3_pages: number
    act1_status: 'short' | 'good' | 'long'
    act2_status: 'short' | 'good' | 'long'
    act3_status: 'short' | 'good' | 'long'
  }
  pacing_issues: string[]
  structure_score: number
  recommendations: string[]
}

export interface ScriptCoverage {
  logline_strength: number
  character_development: number
  dialogue_quality: number
  structure_adherence: number
  marketability: number
  overall_score: number
  comparables: string[]
  genre: string
  target_audience: string
  estimated_budget_range: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

export class AIScriptService {
  /**
   * Polish and enhance dialogue
   */
  static async enhanceDialogue(
    dialogue: string,
    character?: ScriptCharacter,
    context?: {
      emotion?: string
      instruction?: string
      previousLines?: string[]
    }
  ): Promise<DialogueEnhancement> {
    const characterInfo = character
      ? `Character: ${character.name}${character.description ? `\nDescription: ${character.description}` : ''}`
      : ''

    const contextInfo = context?.previousLines
      ? `\nPrevious dialogue:\n${context.previousLines.join('\n')}`
      : ''

    const instruction =
      context?.instruction || 'Polish this dialogue to be more natural and compelling'
    const emotion = context?.emotion ? `\nEmotion: ${context.emotion}` : ''

    const prompt = `${instruction}

${characterInfo}${emotion}${contextInfo}

Original dialogue:
"${dialogue}"

Provide 3 alternative versions that improve the dialogue. For each, explain the change and what makes it better. Format as JSON:
{
  "suggestions": [
    {
      "text": "improved dialogue here",
      "reasoning": "why this is better",
      "emotion": "emotion conveyed"
    }
  ]
}`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(response)

    return {
      original: dialogue,
      suggestions: parsed.suggestions,
    }
  }

  /**
   * Generate story beats
   */
  static async generateBeats(
    logline: string,
    genre: string,
    scriptType: 'screenplay' | 'tv_pilot' | 'stage_play' = 'screenplay'
  ): Promise<BeatGenerationResult> {
    const pageRanges: Record<string, string> = {
      screenplay: '90-120 pages',
      tv_pilot: '25-35 pages',
      stage_play: '80-100 pages',
    }

    const prompt = `Generate story beats using Save the Cat! methodology for this ${genre} ${scriptType}:

Logline: "${logline}"

Expected length: ${pageRanges[scriptType]}

Provide 15 beats following Blake Snyder's Save the Cat! structure:
1. Opening Image
2. Theme Stated
3. Setup
4. Catalyst
5. Debate
6. Break Into Two
7. B Story
8. Fun and Games
9. Midpoint
10. Bad Guys Close In
11. All Is Lost
12. Dark Night of the Soul
13. Break Into Three
14. Finale
15. Final Image

For each beat, provide:
- title: The beat name
- description: What happens in this beat (2-3 sentences)
- beat_type: The beat type from the list above (lowercase, underscored)
- page_reference: Approximate page number

Format as JSON:
{
  "beats": [
    {
      "title": "Opening Image",
      "description": "...",
      "beat_type": "opening_image",
      "page_reference": 1
    }
  ]
}`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }

  /**
   * Analyze script structure
   */
  static async analyzeStructure(
    elements: ScriptElement[],
    totalPages: number,
    scriptType: 'screenplay' | 'tv_pilot' | 'stage_play' = 'screenplay'
  ): Promise<StructureAnalysis> {
    // Extract scene headings and page numbers
    const sceneHeadings = elements
      .filter(el => el.element_type === 'scene_heading')
      .map(el => ({
        content: el.content,
        page: el.page_number || 0,
      }))

    const sceneList = sceneHeadings.map(s => `Page ${s.page}: ${s.content}`).join('\n')

    const prompt = `Analyze the structure of this ${scriptType} (${totalPages} pages):

Scenes:
${sceneList}

Provide a structural analysis:
1. Act breakdown (where does Act 1, 2, 3 end?)
2. Identify pacing issues
3. Structure score (1-10)
4. Specific recommendations

Format as JSON:
{
  "act_breakdown": {
    "act1_pages": 25,
    "act2_pages": 60,
    "act3_pages": 30,
    "act1_status": "good",
    "act2_status": "long",
    "act3_status": "good"
  },
  "pacing_issues": ["Act 2 drags", "..."],
  "structure_score": 7,
  "recommendations": ["Consider splitting Act 2 at page 55", "..."]
}`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }

  /**
   * Generate professional script coverage
   */
  static async generateCoverage(
    title: string,
    logline: string,
    genre: string[],
    elements: ScriptElement[],
    totalPages: number
  ): Promise<ScriptCoverage> {
    // Extract sample dialogue and action
    const dialogue = elements
      .filter(el => el.element_type === 'dialogue')
      .slice(0, 20)
      .map(el => el.content)
      .join('\n')

    const action = elements
      .filter(el => el.element_type === 'action')
      .slice(0, 10)
      .map(el => el.content)
      .join('\n')

    const prompt = `Provide professional script coverage for this screenplay:

Title: "${title}"
Logline: "${logline}"
Genre: ${genre.join(', ')}
Length: ${totalPages} pages

Sample dialogue:
${dialogue}

Sample action:
${action}

Provide comprehensive coverage with scores (1-10) for:
- Logline strength
- Character development
- Dialogue quality
- Structure adherence
- Marketability
- Overall score

Also include:
- 3-5 comparable films
- Target audience
- Estimated budget range
- Key strengths (3-5)
- Key weaknesses (3-5)
- Recommendations (3-5)

Format as JSON:
{
  "logline_strength": 8,
  "character_development": 7,
  "dialogue_quality": 8,
  "structure_adherence": 7,
  "marketability": 6,
  "overall_score": 7,
  "comparables": ["Die Hard", "The Matrix"],
  "genre": "Action-Thriller with Sci-Fi elements",
  "target_audience": "Males 18-49, action fans",
  "estimated_budget_range": "$40-60M",
  "strengths": ["Strong opening", "..."],
  "weaknesses": ["Act 2 pacing", "..."],
  "recommendations": ["Tighten Act 2", "..."]
}`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }

  /**
   * Check character voice consistency
   */
  static async checkCharacterVoice(
    characterName: string,
    dialogueLines: Array<{ page: number; line: string }>,
    characterDescription?: string
  ): Promise<{
    consistency_score: number
    inconsistent_lines: Array<{ page: number; line: string; reason: string }>
    voice_profile: string
    recommendations: string[]
  }> {
    const dialogueText = dialogueLines.map(d => `Page ${d.page}: "${d.line}"`).join('\n')

    const descriptionText = characterDescription
      ? `\nCharacter description: ${characterDescription}`
      : ''

    const prompt = `Analyze character voice consistency for ${characterName}:${descriptionText}

Dialogue:
${dialogueText}

Analyze:
1. Consistency score (1-10)
2. Identify lines that feel out of character
3. Define the character's voice profile
4. Recommendations for improvement

Format as JSON:
{
  "consistency_score": 8,
  "inconsistent_lines": [
    {
      "page": 42,
      "line": "...",
      "reason": "Too formal compared to established voice"
    }
  ],
  "voice_profile": "Sarcastic, quick-witted, uses short sentences",
  "recommendations": ["Make dialogue more consistent", "..."]
}`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1536,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }
}
