import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { AIClient } from '@/src/lib/ai/ai-client'
import { buildDescribePrompt, SYSTEM_PROMPTS } from '@/src/lib/ai/prompts/writing-prompts'
import { AIService } from '@/src/lib/ai-editor-service'
import type { DescribeRequest } from '@/src/lib/ai/prompts/writing-prompts'

export async function POST(request: NextRequest) {
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

    const body: DescribeRequest & { manuscriptId?: string; sceneId?: string } = await request.json()

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
    console.error('AI Describe Error:', error)
    return NextResponse.json({ error: error.message || 'AI request failed' }, { status: 500 })
  }
}
