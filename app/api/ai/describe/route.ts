import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { AIClient } from '@/src/lib/ai/ai-client'
import { buildDescribePrompt, SYSTEM_PROMPTS } from '@/src/lib/ai/prompts/writing-prompts'
import { AIService } from '@/src/lib/ai-editor-service'
import type { DescribeRequest } from '@/src/lib/ai/prompts/writing-prompts'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { validateAIRequest, validationErrorResponse } from '@/src/lib/ai-validation'
import { getSafeErrorMessage } from '@/src/lib/error-handling'
import logger from '@/src/lib/logger'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

async function handleDescribe(request: NextRequest) {
  let user: any = null
  try {
    const result = await getServerUser()
    user = result.user
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const usageLimits = await AIService.checkUsageLimits(user.id)
    if (!usageLimits.canUseAI) {
      return NextResponse.json(
        { error: 'AI usage limit reached', limits: usageLimits },
        { status: 429 }
      )
    }

    const body: DescribeRequest & { manuscriptId?: string; sceneId?: string } = await request.json()

    // Validate input
    const validation = validateAIRequest(body)
    if (!validation.valid) {
      return NextResponse.json(validationErrorResponse(validation.errors), { status: 400 })
    }

    const userPrompt = buildDescribePrompt(body)
    const userTier = user.profile?.account_tier || 'free'
    const aiClient = new AIClient(userTier as any)

    const response = await aiClient.complete(
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.describe },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 800,
        temperature: 0.9, // Very creative for descriptions
      },
      'describe'
    )

    // Note: Usage logging is handled inside AIService.describe()

    return NextResponse.json({
      success: true,
      content: response.content,
      model: response.model,
      provider: response.provider,
      tokensUsed: response.tokensUsed,
    })
  } catch (error: any) {
    logger.error('AI Describe request failed', error, {
      userId: user?.id,
      userTier: user?.profile?.account_tier,
      endpoint: 'describe',
    })
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'AI request failed') },
      { status: 500 }
    )
  }
}

export const POST = createRateLimitedHandler('ai', handleDescribe)
