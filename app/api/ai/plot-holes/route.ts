import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { AIClient } from '@/src/lib/ai/ai-client'
import { AIService } from '@/src/lib/ai-editor-service'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { validateAIRequest, validationErrorResponse } from '@/src/lib/ai-validation'
import { getSafeErrorMessage } from '@/src/lib/error-handling'

export const dynamic = 'force-dynamic'

const PLOT_HOLE_SYSTEM_PROMPT = `You are an expert story analyst specializing in plot consistency and logic. Your task is to identify plot holes, inconsistencies, and logical issues in narrative text.

Focus on:
1. Timeline inconsistencies
2. Character motivation problems
3. Logic gaps and contradictions
4. Unresolved plot threads
5. Cause-and-effect issues
6. World-building contradictions

Provide clear, actionable feedback with specific examples from the text.`

async function handlePlotHoleDetection(request: NextRequest) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check usage limits
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

    const prompt = `Analyze the following story text for plot holes, inconsistencies, and logical issues:

${body.text}

Provide a detailed analysis in the following format:

## Plot Holes & Inconsistencies

### Critical Issues
[List any critical plot holes that break the story logic]

### Timeline Issues
[Any problems with the sequence of events or time references]

### Character Motivation Problems
[Instances where character actions don't align with their established motivations]

### Logic Gaps
[Areas where cause-and-effect relationships are missing or unclear]

### Unresolved Plot Threads
[Story elements introduced but not properly concluded]

## Recommendations
[Specific, actionable suggestions to fix each identified issue]

Analysis:`

    const response = await aiClient.complete(
      {
        messages: [
          { role: 'system', content: PLOT_HOLE_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        maxTokens: 3000,
        temperature: 0.3, // Lower temperature for analytical tasks
      },
      'plot_holes'
    )

    // Log usage
    if (body.manuscriptId) {
      await AIService.logUsage(user.id, {
        manuscriptId: body.manuscriptId,
        feature: 'plot_holes',
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
    console.error('Plot Hole Detection Error:', error)
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'AI request failed') },
      { status: 500 }
    )
  }
}

export const POST = createRateLimitedHandler('ai', handlePlotHoleDetection)
