import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { AIClient } from '@/src/lib/ai/ai-client'
import { buildRewritePrompt, SYSTEM_PROMPTS } from '@/src/lib/ai/prompts/writing-prompts'
import { AIService } from '@/src/lib/ai-editor-service'
import type { RewriteRequest } from '@/src/lib/ai/prompts/writing-prompts'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { validateAIRequest, validationErrorResponse } from '@/src/lib/ai-validation'
import { getSafeErrorMessage } from '@/src/lib/error-handling'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

async function handleRewrite(request: NextRequest) {
  try {
    const { user } = await getServerUser()
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

    const body: RewriteRequest & { manuscriptId?: string; sceneId?: string } = await request.json()

    // Validate input
    const validation = validateAIRequest(body)
    if (!validation.valid) {
      return NextResponse.json(validationErrorResponse(validation.errors), { status: 400 })
    }

    const userPrompt = buildRewritePrompt(body)
    const userTier = user.profile?.account_tier || 'free'
    const aiClient = new AIClient(userTier as any)

    const response = await aiClient.complete(
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.rewrite },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: Math.ceil(body.text.length * 1.5), // Rewrite can be longer
        temperature: 0.7,
      },
      'rewrite'
    )

    // Note: Usage logging is handled inside AIService.rewrite()

    return NextResponse.json({
      success: true,
      content: response.content,
      model: response.model,
      provider: response.provider,
      tokensUsed: response.tokensUsed,
    })
  } catch (error: any) {
    console.error('AI Rewrite Error:', error)
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'AI request failed') },
      { status: 500 }
    )
  }
}

export const POST = createRateLimitedHandler('ai', handleRewrite)
