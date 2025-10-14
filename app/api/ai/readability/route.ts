import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { AIClient } from '@/src/lib/ai/ai-client'
import { AIService } from '@/src/lib/ai-editor-service'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { validateAIRequest, validationErrorResponse } from '@/src/lib/ai-validation'
import { getSafeErrorMessage } from '@/src/lib/error-handling'

export const dynamic = 'force-dynamic'

const READABILITY_SYSTEM_PROMPT = `You are an expert in readability analysis and writing assessment. Analyze text for clarity, accessibility, and reading level using standard metrics like Flesch-Kincaid, and provide actionable improvement suggestions.`

async function handleReadabilityAnalysis(request: NextRequest) {
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

    const body: { text: string; manuscriptId?: string } = await request.json()

    // Validate input
    const validation = validateAIRequest(body)
    if (!validation.valid) {
      return NextResponse.json(validationErrorResponse(validation.errors), { status: 400 })
    }

    if (!body.text || body.text.length < 50) {
      return NextResponse.json(
        { error: 'Text must be at least 50 characters long' },
        { status: 400 }
      )
    }

    const userTier = user.profile?.account_tier || 'free'
    const aiClient = new AIClient(userTier as any)

    const prompt = `Analyze the readability and accessibility of this text:

${body.text}

Provide analysis in this format:

## Readability Analysis

### Reading Level
- **Grade Level**: [Estimated grade level (e.g., 8th-9th grade)]
- **Flesch-Kincaid Score**: [Estimate and explain]
- **Target Audience**: [Who this is most appropriate for]

### Sentence Complexity
- **Average Sentence Length**: [Estimate words per sentence]
- **Sentence Variety**: [Rate variety and flow]
- **Complex vs Simple**: [Balance analysis]

### Vocabulary Assessment
- **Word Choice**: [Evaluate vocabulary level]
- **Jargon/Technical Terms**: [Identify any barriers]
- **Clarity Score**: [Rate 1-10 with explanation]

### Pacing & Flow
- **Reading Rhythm**: [Analyze flow and cadence]
- **Paragraph Structure**: [Evaluate organization]
- **Transitions**: [Assess connection between ideas]

### Accessibility Score: [X/10]
**Explanation**: [Why this score]

## Recommendations
[5-7 specific, actionable suggestions to improve readability]

Analysis:`

    const response = await aiClient.complete(
      {
        messages: [
          { role: 'system', content: READABILITY_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        maxTokens: 2000,
        temperature: 0.3,
      },
      'readability'
    )

    if (body.manuscriptId) {
      await AIService.logUsage(user.id, {
        manuscriptId: body.manuscriptId,
        feature: 'readability',
        tokensUsed: response.tokensUsed?.total || 0,
        model: response.model,
        provider: response.provider,
      })
    }

    return NextResponse.json({
      success: true,
      analysis: response.content,
      model: response.model,
      provider: response.provider,
      tokensUsed: response.tokensUsed,
    })
  } catch (error: any) {
    console.error('Readability Analysis Error:', error)
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'AI request failed') },
      { status: 500 }
    )
  }
}

export const POST = createRateLimitedHandler('ai', handleReadabilityAnalysis)
