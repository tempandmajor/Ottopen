// Anthropic Claude API Client
import Anthropic from '@anthropic-ai/sdk'
import type { AICompletionRequest, AICompletionResponse, AIStreamChunk } from './ai-provider'

let anthropic: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    })
  }
  return anthropic
}

export async function callAnthropic(
  request: AICompletionRequest,
  model: string = 'claude-3-5-sonnet-20241022'
): Promise<AICompletionResponse> {
  try {
    // Separate system messages from user/assistant messages
    const systemMessage = request.messages.find(m => m.role === 'system')?.content || ''
    const conversationMessages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const completion = await getAnthropic().messages.create({
      model,
      system: systemMessage,
      messages: conversationMessages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      stream: false,
    })

    const content = completion.content[0]
    const textContent = content.type === 'text' ? content.text : ''

    return {
      content: textContent,
      model: completion.model,
      provider: 'anthropic',
      tokensUsed: {
        prompt: completion.usage.input_tokens,
        completion: completion.usage.output_tokens,
        total: completion.usage.input_tokens + completion.usage.output_tokens,
      },
      finishReason: completion.stop_reason || 'end_turn',
    }
  } catch (error: any) {
    console.error('Anthropic API Error:', error)
    throw new Error(`Anthropic API failed: ${error.message}`)
  }
}

export async function* streamAnthropic(
  request: AICompletionRequest,
  model: string = 'claude-3-5-sonnet-20241022'
): AsyncGenerator<AIStreamChunk> {
  try {
    const systemMessage = request.messages.find(m => m.role === 'system')?.content || ''
    const conversationMessages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const stream = await getAnthropic().messages.create({
      model,
      system: systemMessage,
      messages: conversationMessages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      stream: true,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta
        if (delta.type === 'text_delta') {
          yield {
            content: delta.text,
            done: false,
          }
        }
      }

      if (event.type === 'message_stop') {
        yield {
          content: '',
          done: true,
        }
      }
    }
  } catch (error: any) {
    console.error('Anthropic Streaming Error:', error)
    throw new Error(`Anthropic streaming failed: ${error.message}`)
  }
}
