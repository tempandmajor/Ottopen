import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { AIClient } from '@/src/lib/ai/ai-client'
import { buildBrainstormPrompt, SYSTEM_PROMPTS } from '@/src/lib/ai/prompts/writing-prompts'
import { AIService } from '@/src/lib/ai-editor-service'
import type { BrainstormRequest } from '@/src/lib/ai/prompts/writing-prompts'

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

    const body: BrainstormRequest & { manuscriptId?: string } = await request.json()

    const userPrompt = buildBrainstormPrompt(body)
    const userTier = user.profile?.account_tier || 'free'
    const aiClient = new AIClient(userTier as any)

    const response = await aiClient.complete(
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.brainstorm },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 1500,
        temperature: 1.0, // Maximum creativity for brainstorming
      },
      'brainstorm'
    )

    // Note: Usage logging is handled inside AIService.brainstorm()

    return NextResponse.json({
      success: true,
      content: response.content,
      model: response.model,
      provider: response.provider,
      tokensUsed: response.tokensUsed,
    })
  } catch (error: any) {
    console.error('AI Brainstorm Error:', error)
    return NextResponse.json({ error: error.message || 'AI request failed' }, { status: 500 })
  }
}
