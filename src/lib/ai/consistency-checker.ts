// POV and Tense Consistency Checker
import { getAIClient } from './ai-client'

export type POVType = 'first-person' | 'second-person' | 'third-limited' | 'third-omniscient'
export type TenseType = 'present' | 'past' | 'future'

export interface ConsistencyCheckResult {
  isConsistent: boolean
  detectedPOV: POVType[]
  detectedTense: TenseType[]
  issues: Array<{
    type: 'pov-shift' | 'tense-shift'
    location: string
    found: string
    expected: string
    severity: 'low' | 'medium' | 'high'
  }>
  suggestions: string[]
}

/**
 * Analyze text for POV consistency
 */
export function detectPOV(text: string): POVType[] {
  const povs: POVType[] = []

  // First person indicators
  if (/\b(I|me|my|mine|myself|we|us|our|ours)\b/gi.test(text)) {
    povs.push('first-person')
  }

  // Second person indicators
  if (/\b(you|your|yours|yourself)\b/gi.test(text)) {
    povs.push('second-person')
  }

  // Third person indicators
  if (/\b(he|him|his|she|her|hers|they|them|their)\b/gi.test(text)) {
    // Check for omniscient markers (knowing multiple characters' thoughts)
    const thoughtPattern = new RegExp(
      '\\b(thought|felt|knew|realized|wondered)\\b.*\\b(thought|felt|knew|realized|wondered)\\b',
      'gis'
    )
    if (thoughtPattern.test(text)) {
      povs.push('third-omniscient')
    } else {
      povs.push('third-limited')
    }
  }

  return povs
}

/**
 * Detect narrative tense
 */
export function detectTense(text: string): TenseType[] {
  const tenses: TenseType[] = []

  // Past tense indicators
  if (/\b(was|were|had|did|went|said|looked|walked|ran)\b/gi.test(text)) {
    tenses.push('past')
  }

  // Present tense indicators
  if (/\b(is|are|has|does|goes|says|looks|walks|runs)\b/gi.test(text)) {
    tenses.push('present')
  }

  // Future tense indicators
  if (/\b(will|shall|going to)\b/gi.test(text)) {
    tenses.push('future')
  }

  return tenses
}

/**
 * Check consistency across a manuscript
 */
export async function checkConsistency(
  text: string,
  expectedPOV?: POVType,
  expectedTense?: TenseType,
  userId?: string,
  userTier: 'free' | 'pro' | 'premium' | 'enterprise' = 'free'
): Promise<ConsistencyCheckResult> {
  const detectedPOVs = detectPOV(text)
  const detectedTenses = detectTense(text)

  // Use AI for deep analysis
  const client = getAIClient(userTier)

  const prompt = `Analyze this text for POV and tense consistency issues.

Expected POV: ${expectedPOV || 'auto-detect'}
Expected Tense: ${expectedTense || 'auto-detect'}

TEXT:
${text.substring(0, 2000)}

Identify:
1. Any shifts in POV (first person, third person limited, third person omniscient)
2. Any shifts in narrative tense (past, present)
3. The severity of each issue (low/medium/high)
4. Specific locations where issues occur

Format as JSON with this structure:
{
  "issues": [
    {
      "type": "pov-shift" or "tense-shift",
      "location": "quote from text",
      "found": "what was found",
      "expected": "what was expected",
      "severity": "low/medium/high"
    }
  ],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`

  try {
    const response = await client.complete(
      {
        messages: [
          {
            role: 'system',
            content:
              'You are an expert editor specialized in narrative consistency. Analyze text for POV and tense issues.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3, // Low temperature for analytical task
      },
      'critique'
    )

    // Parse AI response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    const aiAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { issues: [], suggestions: [] }

    return {
      isConsistent:
        detectedPOVs.length === 1 && detectedTenses.length === 1 && aiAnalysis.issues.length === 0,
      detectedPOV: detectedPOVs,
      detectedTense: detectedTenses,
      issues: aiAnalysis.issues || [],
      suggestions: aiAnalysis.suggestions || [],
    }
  } catch (error) {
    // Fallback to basic detection if AI fails
    return {
      isConsistent: detectedPOVs.length === 1 && detectedTenses.length === 1,
      detectedPOV: detectedPOVs,
      detectedTense: detectedTenses,
      issues: [],
      suggestions: ['Enable AI analysis for detailed consistency checking'],
    }
  }
}

/**
 * Enforce consistency when generating new content
 */
export function buildConsistencyInstructions(pov: POVType, tense: TenseType): string {
  const povInstructions = {
    'first-person': 'Write in first person using I/me/my pronouns',
    'second-person': 'Write in second person using you/your pronouns',
    'third-limited':
      "Write in third person limited, showing only one character's perspective and thoughts",
    'third-omniscient':
      "Write in third person omniscient, able to show multiple characters' thoughts",
  }

  const tenseInstructions = {
    present: 'Write in present tense (walks, runs, says)',
    past: 'Write in past tense (walked, ran, said)',
    future: 'Write in future tense (will walk, will run, will say)',
  }

  return `
CONSISTENCY REQUIREMENTS:
- POV: ${povInstructions[pov]}
- Tense: ${tenseInstructions[tense]}

Maintain these throughout your response. Do not shift POV or tense.`
}
