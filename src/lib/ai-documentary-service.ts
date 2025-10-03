// Documentary AI Service
// Fact-checking, research assistance, interview questions, narrative structure

import Anthropic from '@anthropic-ai/sdk'
import type { ScriptElement, Script } from '@/src/types/script-editor'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface FactCheck {
  claim: string
  elementId: string
  pageNumber: number
  verification: 'verified' | 'disputed' | 'unverified' | 'misleading'
  confidence: number
  sources: string[]
  notes: string
  suggestedCorrection?: string
}

export interface InterviewQuestion {
  question: string
  purpose: string
  followUps: string[]
  expectedDuration: number
}

export interface DocumentaryStructure {
  actBreakdown: {
    opening: { startPage: number; endPage: number; theme: string }
    rising: { startPage: number; endPage: number; theme: string }
    climax: { startPage: number; endPage: number; theme: string }
    resolution: { startPage: number; endPage: number; theme: string }
  }
  narrativeDevices: {
    narrationPercentage: number
    interviewPercentage: number
    bRollPercentage: number
    archivePercentage: number
  }
  pacingAnalysis: {
    score: number
    slowSections: Array<{ page: number; reason: string }>
    recommendations: string[]
  }
  emotionalArc: {
    score: number
    keyMoments: Array<{ page: number; emotion: string; description: string }>
  }
}

export interface ResearchSuggestion {
  topic: string
  relevance: string
  suggestedSources: string[]
  keyQuestions: string[]
  visualOpportunities: string[]
}

export class AIDocumentaryService {
  /**
   * Fact-check claims in documentary script
   */
  static async factCheckScript(script: Script, elements: ScriptElement[]): Promise<FactCheck[]> {
    // Extract narration and interview answers (where factual claims are made)
    const factualElements = elements.filter(
      el =>
        el.element_type === 'narration' ||
        el.element_type === 'interview_answer' ||
        el.element_type === 'action'
    )

    const factChecks: FactCheck[] = []

    // Process in batches to avoid token limits
    for (let i = 0; i < Math.min(factualElements.length, 20); i += 5) {
      const batch = factualElements.slice(i, i + 5)
      const batchText = batch.map(el => `[Page ${el.page_number}]: ${el.content}`).join('\n\n')

      const prompt = `Fact-check the following claims from a documentary script about "${script.title}":

${batchText}

For each claim that makes a factual assertion, provide:
1. Verification status (verified, disputed, unverified, misleading)
2. Confidence level (0-100)
3. Brief notes on verification
4. Suggested correction if needed

Format as JSON:
{
  "checks": [
    {
      "claim": "the specific claim",
      "pageNumber": number,
      "verification": "verified" | "disputed" | "unverified" | "misleading",
      "confidence": 0-100,
      "notes": "explanation",
      "suggestedCorrection": "if needed"
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

      for (const check of parsed.checks || []) {
        const element = batch.find(el => el.page_number === check.pageNumber)
        if (element) {
          factChecks.push({
            ...check,
            elementId: element.id,
            sources: [], // Would integrate with external APIs for sources
          })
        }
      }
    }

    return factChecks
  }

  /**
   * Generate interview questions for subjects
   */
  static async generateInterviewQuestions(
    subject: string,
    topic: string,
    context: string,
    duration: number = 30
  ): Promise<InterviewQuestion[]> {
    const prompt = `Generate interview questions for a documentary subject:

Subject: ${subject}
Topic: ${topic}
Context: ${context}
Target Duration: ${duration} minutes

Generate 8-12 interview questions that:
1. Start broad and get more specific
2. Encourage storytelling (not yes/no answers)
3. Build emotional connection
4. Reveal unique insights
5. Create natural follow-up opportunities

Format as JSON:
{
  "questions": [
    {
      "question": "the question",
      "purpose": "why ask this",
      "followUps": ["follow-up 1", "follow-up 2"],
      "expectedDuration": minutes
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

    return parsed.questions || []
  }

  /**
   * Analyze documentary narrative structure
   */
  static async analyzeDocumentaryStructure(
    script: Script,
    elements: ScriptElement[]
  ): Promise<DocumentaryStructure> {
    // Count element types
    const narrationCount = elements.filter(el => el.element_type === 'narration').length
    const interviewCount = elements.filter(el => el.element_type === 'interview_answer').length
    const bRollCount = elements.filter(el => el.element_type === 'b_roll').length
    const archiveCount = elements.filter(el => el.element_type === 'archive_footage').length

    const totalElements = elements.length
    const narrationPct = (narrationCount / totalElements) * 100
    const interviewPct = (interviewCount / totalElements) * 100
    const bRollPct = (bRollCount / totalElements) * 100
    const archivePct = (archiveCount / totalElements) * 100

    // Get sample content for AI analysis
    const narrations = elements
      .filter(el => el.element_type === 'narration')
      .slice(0, 20)
      .map(el => `Page ${el.page_number}: ${el.content}`)
      .join('\n')

    const prompt = `Analyze the narrative structure of this documentary script:

Title: "${script.title}"
Total Pages: ${script.page_count}
Genre: ${script.genre.join(', ')}

Narration Distribution: ${narrationPct.toFixed(1)}%
Interview Distribution: ${interviewPct.toFixed(1)}%
B-Roll Distribution: ${bRollPct.toFixed(1)}%
Archive Distribution: ${archivePct.toFixed(1)}%

Sample Narration:
${narrations}

Provide structure analysis in JSON format:
{
  "actBreakdown": {
    "opening": { "startPage": 1, "endPage": number, "theme": "string" },
    "rising": { "startPage": number, "endPage": number, "theme": "string" },
    "climax": { "startPage": number, "endPage": number, "theme": "string" },
    "resolution": { "startPage": number, "endPage": number, "theme": "string" }
  },
  "pacingAnalysis": {
    "score": 1-10,
    "slowSections": [{ "page": number, "reason": "string" }],
    "recommendations": ["tip1", "tip2"]
  },
  "emotionalArc": {
    "score": 1-10,
    "keyMoments": [
      { "page": number, "emotion": "string", "description": "string" }
    ]
  }
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const parsed = JSON.parse(response)

    return {
      ...parsed,
      narrativeDevices: {
        narrationPercentage: Math.round(narrationPct),
        interviewPercentage: Math.round(interviewPct),
        bRollPercentage: Math.round(bRollPct),
        archivePercentage: Math.round(archivePct),
      },
    }
  }

  /**
   * Suggest research topics and sources
   */
  static async suggestResearch(script: Script, topic: string): Promise<ResearchSuggestion[]> {
    const prompt = `Suggest research directions for a documentary about "${topic}":

Documentary Title: "${script.title}"
Genre: ${script.genre.join(', ')}

Provide 5-7 research suggestions in JSON format:
{
  "suggestions": [
    {
      "topic": "specific research topic",
      "relevance": "why this matters",
      "suggestedSources": ["source 1", "source 2"],
      "keyQuestions": ["question 1", "question 2"],
      "visualOpportunities": ["visual 1", "visual 2"]
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

    return parsed.suggestions || []
  }

  /**
   * Generate B-Roll suggestions based on narration
   */
  static async generateBRollSuggestions(narration: string, context: string): Promise<string[]> {
    const prompt = `Generate B-Roll visual suggestions for this documentary narration:

Context: ${context}
Narration: "${narration}"

Provide 5-7 specific B-Roll shots that would visually support this narration.
Be specific about:
- What to shoot
- Camera movement/angle if relevant
- Lighting/mood

Format as JSON array: ["shot 1", "shot 2", ...]`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : '[]'
    return JSON.parse(response)
  }

  /**
   * Suggest archive footage searches
   */
  static async suggestArchiveFootage(
    topic: string,
    timeperiod?: string,
    location?: string
  ): Promise<Array<{ keyword: string; description: string; sources: string[] }>> {
    const context = [
      topic,
      timeperiod ? `Time period: ${timeperiod}` : '',
      location ? `Location: ${location}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const prompt = `Suggest archive footage search terms for a documentary:

${context}

Provide 5-8 specific archive footage searches with:
- Search keywords
- What to look for
- Potential archive sources (Getty, Shutterstock, Library of Congress, etc.)

Format as JSON:
{
  "searches": [
    {
      "keyword": "search term",
      "description": "what this footage shows",
      "sources": ["source 1", "source 2"]
    }
  ]
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1536,
      messages: [{ role: 'user', content: prompt }],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const parsed = JSON.parse(response)

    return parsed.searches || []
  }
}
