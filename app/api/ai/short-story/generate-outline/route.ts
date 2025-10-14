import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { AIClient } from '@/src/lib/ai/ai-client'
import { AIService } from '@/src/lib/ai-editor-service'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { validateAIRequest, validationErrorResponse } from '@/src/lib/ai-validation'
import { getSafeErrorMessage } from '@/src/lib/error-handling'

export const dynamic = 'force-dynamic'

const SHORT_STORY_OUTLINE_SYSTEM_PROMPT = `You are an expert short story writing coach and outline creator. Your task is to generate comprehensive, detailed outlines for short stories that writers can immediately use to begin writing.

Your outlines should be:
- Specific and actionable (not generic)
- Include rich character details
- Provide clear scene breakdowns with word count allocations
- Offer writing tips specific to the genre and format
- Suggest powerful opening and closing moments

Be creative, insightful, and provide outlines that inspire writers to create compelling short stories.`

interface GenerateOutlineRequest {
  genre: string
  theme: string
  wordCount: number
  manuscriptId?: string
  additionalContext?: string
}

async function handleGenerateOutline(request: NextRequest) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const usageLimits = await AIService.checkUsageLimits(user.id)
    if (!usageLimits.canUseAI) {
      return NextResponse.json(
        {
          error: 'AI usage limit reached',
          limits: usageLimits,
        },
        { status: 429 }
      )
    }

    const body: GenerateOutlineRequest = await request.json()

    // Validate input
    const validation = validateAIRequest(body)
    if (!validation.valid) {
      return NextResponse.json(validationErrorResponse(validation.errors), { status: 400 })
    }

    if (!body.genre || !body.theme || !body.wordCount) {
      return NextResponse.json(
        { error: 'Genre, theme, and word count are required' },
        { status: 400 }
      )
    }

    const pageCount = Math.ceil(body.wordCount / 250)

    const userTier = user.profile?.account_tier || 'free'
    const aiClient = new AIClient(userTier as any)

    const contextNote = body.additionalContext
      ? `\n\nAdditional Context: ${body.additionalContext}`
      : ''

    const prompt = `Create a detailed, ready-to-write outline for a ${body.wordCount}-word (approximately ${pageCount} pages) short story in the ${body.genre} genre exploring the theme: "${body.theme}".${contextNote}

Provide a comprehensive outline in the following format:

## Story Information
**Word Count**: ${body.wordCount} words (~${pageCount} pages @ 250 words/page)
**Genre**: ${body.genre}
**Theme**: ${body.theme}

## Title Suggestions
Provide 5 compelling, evocative title options with brief explanations.

## Logline
A compelling one-sentence summary of the story.

## Characters

### Protagonist
- **Name & Age**:
- **Occupation/Role**:
- **Core Trait**:
- **Internal Conflict**:
- **What They Want**:
- **What They Need**:
- **Character Arc**:

### Supporting Characters (2-3)
For each:
- **Name & Role**:
- **Key Trait**:
- **Relationship to Protagonist**:
- **Function in Story**:

## Story Structure & Scene Breakdown

### Opening (${Math.round(body.wordCount * 0.15)} words / ${Math.ceil((body.wordCount * 0.15) / 250)} pages)
**Scene Description**:
**Key Events**:
**Mood/Tone**:
**Opening Line Suggestion**:
**Character State**:

### Development (${Math.round(body.wordCount * 0.35)} words / ${Math.ceil((body.wordCount * 0.35) / 250)} pages)
**Scene 1**:
- Description:
- Word count target:
- Key events:

**Scene 2**:
- Description:
- Word count target:
- Key events:

### Climax (${Math.round(body.wordCount * 0.25)} words / ${Math.ceil((body.wordCount * 0.25) / 250)} pages)
**Scene Description**:
**Key Moment**:
**Emotional Peak**:
**Decision Point**:

### Resolution (${Math.round(body.wordCount * 0.25)} words / ${Math.ceil((body.wordCount * 0.25) / 250)} pages)
**Scene Description**:
**How Conflict Resolves**:
**Character Transformation**:
**Final Image/Moment**:
**Closing Line Suggestion**:

## Thematic Elements
- **Primary Theme**: How it's explored
- **Symbols/Motifs**: 2-3 recurring elements
- **Emotional Journey**: Arc from start to finish

## Setting Details
- **Primary Location(s)**:
- **Time Period**:
- **Atmosphere**:
- **Sensory Details to Include**:

## Writing Tips for This Story
1. [Genre-specific technique]
2. [Pacing advice]
3. [Character voice tip]
4. [Dialogue suggestion]
5. [Scene transition advice]

## Key Scenes to Nail
1. **Opening Hook**:
2. **Midpoint Turn**:
3. **Climactic Moment**:
4. **Resonant Ending**:

## Potential Pitfalls to Avoid
- [Common issue 1]
- [Common issue 2]
- [Common issue 3]

Generate a rich, specific outline that a writer can immediately use to start drafting their ${body.wordCount}-word short story.`

    const response = await aiClient.complete(
      {
        messages: [
          { role: 'system', content: SHORT_STORY_OUTLINE_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        maxTokens: 4000,
        temperature: 0.8, // Higher creativity for outline generation
      },
      'short_story_outline'
    )

    // Save outline to database
    const supabase = createServerSupabaseClient()
    const { data: outline, error: outlineError } = await supabase
      .from('short_story_outlines')
      .insert({
        manuscript_id: body.manuscriptId || null,
        user_id: user.id,
        genre: body.genre,
        theme: body.theme,
        target_word_count: body.wordCount,
        logline: extractLogline(response.content),
        title_suggestions: extractTitleSuggestions(response.content),
        characters: {},
        structure: {},
        thematic_elements: extractThematicElements(response.content),
        writing_tips: extractWritingTips(response.content),
        ai_provider: response.provider,
        ai_model: response.model,
      })
      .select()
      .single()

    // Log usage
    if (body.manuscriptId) {
      await AIService.logUsage(user.id, {
        manuscriptId: body.manuscriptId,
        feature: 'short_story_outline',
        tokensUsed: response.tokensUsed?.total || 0,
        model: response.model,
        provider: response.provider,
      })
    }

    return NextResponse.json({
      success: true,
      outline: response.content,
      outlineId: outline?.id,
      model: response.model,
      provider: response.provider,
      tokensUsed: response.tokensUsed,
    })
  } catch (error: any) {
    console.error('Short Story Outline Generation Error:', error)
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'AI request failed') },
      { status: 500 }
    )
  }
}

function extractLogline(content: string): string {
  const match = content.match(/\*\*Logline\*\*:?\s*(.+)/i)
  return match ? match[1].trim() : ''
}

function extractTitleSuggestions(content: string): string[] {
  const titleSection = content.match(/## Title Suggestions([\s\S]*?)##/i)
  if (!titleSection) return []

  const titles = titleSection[1]
    .split('\n')
    .filter(line => line.trim().match(/^\d+\./))
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .slice(0, 5)

  return titles
}

function extractThematicElements(content: string): string[] {
  const themeSection = content.match(/## Thematic Elements([\s\S]*?)##/i)
  if (!themeSection) return []

  return themeSection[1]
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(line => line.length > 0)
}

function extractWritingTips(content: string): string[] {
  const tipsSection = content.match(/## Writing Tips for This Story([\s\S]*?)##/i)
  if (!tipsSection) return []

  return tipsSection[1]
    .split('\n')
    .filter(line => line.trim().match(/^\d+\./))
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(line => line.length > 0)
}

export const POST = createRateLimitedHandler('ai', handleGenerateOutline)
