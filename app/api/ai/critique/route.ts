import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { AIClient } from '@/src/lib/ai/ai-client'
import { buildCritiquePrompt, SYSTEM_PROMPTS } from '@/src/lib/ai/prompts/writing-prompts'
import { AIService } from '@/src/lib/ai-editor-service'
import type { CritiqueRequest } from '@/src/lib/ai/prompts/writing-prompts'

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

    const body: CritiqueRequest & { manuscriptId?: string; sceneId?: string } = await request.json()

    const userPrompt = buildCritiquePrompt(body)
    const userTier = user.profile?.account_tier || 'free'
    const aiClient = new AIClient(userTier as any)

    const response = await aiClient.complete(
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.critique },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 2000,
        temperature: 0.6, // More analytical, less creative
      },
      'critique'
    )

    // Note: Usage logging is handled inside AIService.critique()

    return NextResponse.json({
      success: true,
      content: response.content,
      model: response.model,
      provider: response.provider,
      tokensUsed: response.tokensUsed,
    })
  } catch (error: any) {
    console.error('AI Critique Error:', error)
    return NextResponse.json({ error: error.message || 'AI request failed' }, { status: 500 })
  }
}
