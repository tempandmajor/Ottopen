import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { AIClient } from '@/src/lib/ai/ai-client'
import { AIService } from '@/src/lib/ai-editor-service'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'

export const dynamic = 'force-dynamic'

const CHARACTER_CONSISTENCY_SYSTEM_PROMPT = `You are an expert character development analyst. Your task is to analyze character consistency across scenes and identify any contradictions in personality, voice, behavior, or character arc progression.

Focus on:
1. Personality consistency
2. Voice and dialogue patterns
3. Behavioral patterns and reactions
4. Character arc progression
5. Relationship dynamics
6. Contradictions in characterization

Provide detailed, actionable feedback with specific examples.`

async function handleCharacterConsistency(request: NextRequest) {
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

    const body: {
      characterName: string
      scenes: string[]
      manuscriptId?: string
    } = await request.json()

    if (!body.characterName || !body.scenes || body.scenes.length < 2) {
      return NextResponse.json(
        { error: 'Character name and at least 2 scenes are required' },
        { status: 400 }
      )
    }

    const userTier = user.profile?.account_tier || 'free'
    const aiClient = new AIClient(userTier as any)

    const scenesText = body.scenes
      .map((scene, i) => `**Scene ${i + 1}:**\n${scene}`)
      .join('\n\n---\n\n')

    const prompt = `Analyze the consistency of the character "${body.characterName}" across these scenes:

${scenesText}

Provide a detailed analysis in the following format:

## Character Consistency Analysis for "${body.characterName}"

### Personality Consistency
[Evaluate if the character's core personality traits remain consistent. Note any contradictions.]

### Voice & Dialogue Patterns
[Analyze the character's speaking style, vocabulary, and dialogue patterns across scenes.]

### Behavioral Consistency
[Check if the character's actions and reactions align with their established behavior.]

### Character Arc Progression
[Assess whether the character's development follows a logical progression.]

### Relationship Dynamics
[Examine how the character interacts with others consistently.]

### Identified Inconsistencies
[List specific contradictions with scene references and quotes]

## Recommendations
[Specific suggestions to improve character consistency]

Analysis:`

    const response = await aiClient.complete(
      {
        messages: [
          { role: 'system', content: CHARACTER_CONSISTENCY_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        maxTokens: 3000,
        temperature: 0.3,
      },
      'character_consistency'
    )

    // Log usage
    if (body.manuscriptId) {
      await AIService.logUsage(user.id, {
        manuscriptId: body.manuscriptId,
        feature: 'character_consistency',
        tokensUsed: response.tokensUsed?.total || 0,
        model: response.model,
        provider: response.provider,
      })
    }

    return NextResponse.json({
      success: true,
      analysis: response.content,
      characterName: body.characterName,
      scenesAnalyzed: body.scenes.length,
      model: response.model,
      provider: response.provider,
      tokensUsed: response.tokensUsed,
    })
  } catch (error: any) {
    console.error('Character Consistency Error:', error)
    return NextResponse.json({ error: error.message || 'AI request failed' }, { status: 500 })
  }
}

export const POST = createRateLimitedHandler('ai', handleCharacterConsistency)
