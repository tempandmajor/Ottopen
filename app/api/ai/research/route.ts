import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { callPerplexity, streamPerplexity } from '@/src/lib/ai/perplexity-client'
import { AIService } from '@/src/lib/ai-editor-service'
import { withRateLimit } from '@/src/lib/rate-limit-new'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<Response | NextResponse> {
  // Apply rate limiting
  const rateLimitResult = await withRateLimit(request, 'ai')
  if (!rateLimitResult.success) {
    return rateLimitResult.error!
  }
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

    const body = await request.json()
    const {
      query,
      stream = false,
      recencyFilter,
      domainFilter,
      manuscriptId,
      storyContext,
    } = body as {
      query: string
      stream?: boolean
      recencyFilter?: 'day' | 'week' | 'month' | 'year'
      domainFilter?: string[]
      manuscriptId?: string
      storyContext?: {
        genre?: string
        setting?: string
        timePeriod?: string
        characters?: string[]
        currentScene?: string
      }
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Get user tier (from subscription)
    const userTier = user.profile?.account_tier || 'free'

    // Select model based on tier
    const model =
      userTier === 'industry_premium' || userTier === 'premium'
        ? 'llama-3.1-sonar-large-128k-online'
        : 'llama-3.1-sonar-small-128k-online'

    // Build context-aware system prompt
    let systemPrompt =
      'You are a research assistant helping fiction writers. Provide accurate, well-cited information that helps with world-building, fact-checking, and story research. Be concise but thorough.'

    if (storyContext) {
      const contextParts: string[] = []
      if (storyContext.genre) contextParts.push(`Genre: ${storyContext.genre}`)
      if (storyContext.setting) contextParts.push(`Setting: ${storyContext.setting}`)
      if (storyContext.timePeriod) contextParts.push(`Time Period: ${storyContext.timePeriod}`)
      if (storyContext.characters && storyContext.characters.length > 0) {
        contextParts.push(`Characters: ${storyContext.characters.join(', ')}`)
      }

      if (contextParts.length > 0) {
        systemPrompt += `\n\nSTORY CONTEXT:\n${contextParts.join('\n')}\n\nTailor your research to be relevant to this story's setting, genre, and time period.`
      }

      if (storyContext.currentScene) {
        systemPrompt += `\n\nCURRENT SCENE EXCERPT:\n${storyContext.currentScene.substring(0, 500)}...\n\nProvide research that helps the writer develop this scene authentically.`
      }
    }

    // Handle streaming response
    if (stream) {
      const encoder = new TextEncoder()

      const readable = new ReadableStream({
        async start(controller) {
          try {
            const streamIterator = streamPerplexity(
              {
                messages: [
                  {
                    role: 'system',
                    content: systemPrompt,
                  },
                  {
                    role: 'user',
                    content: query,
                  },
                ],
                maxTokens: 1500,
                temperature: 0.2,
              },
              model,
              {
                returnCitations: true,
                recencyFilter,
                domainFilter,
              }
            )

            for await (const chunk of streamIterator) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error: any) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
            )
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // Non-streaming response
    const response = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        maxTokens: 1500,
        temperature: 0.2,
      },
      model,
      {
        returnCitations: true,
        returnImages: false,
        recencyFilter,
        domainFilter,
      }
    )

    // Log usage (track in AI usage tracker)
    // Note: AIService.logUsage is private, logging handled internally by researchQuery

    return NextResponse.json({
      success: true,
      answer: response.content,
      citations: response.citations || [],
      model: response.model,
      provider: response.provider,
      tokensUsed: response.tokensUsed,
    })
  } catch (error: any) {
    console.error('AI Research Error:', error)
    return NextResponse.json({ error: error.message || 'Research request failed' }, { status: 500 })
  }
}
