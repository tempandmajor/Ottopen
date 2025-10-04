// OpenAI API Client
import OpenAI from 'openai'
import type { AICompletionRequest, AICompletionResponse, AIStreamChunk } from './ai-provider'

let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    })
  }
  return openai
}

export async function callOpenAI(
  request: AICompletionRequest,
  model: string = 'gpt-5-turbo'
): Promise<AICompletionResponse> {
  try {
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      stream: false,
    })

    const message = completion.choices[0].message
    const usage = completion.usage

    return {
      content: message.content || '',
      model: completion.model,
      provider: 'openai',
      tokensUsed: {
        prompt: usage?.prompt_tokens || 0,
        completion: usage?.completion_tokens || 0,
        total: usage?.total_tokens || 0,
      },
      finishReason: completion.choices[0].finish_reason || 'stop',
    }
  } catch (error: any) {
    console.error('OpenAI API Error:', error)
    throw new Error(`OpenAI API failed: ${error.message}`)
  }
}

export async function* streamOpenAI(
  request: AICompletionRequest,
  model: string = 'gpt-5-turbo'
): AsyncGenerator<AIStreamChunk> {
  try {
    const stream = await getOpenAI().chat.completions.create({
      model,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      const done = chunk.choices[0]?.finish_reason !== null

      yield {
        content,
        done,
      }
    }
  } catch (error: any) {
    console.error('OpenAI Streaming Error:', error)
    throw new Error(`OpenAI streaming failed: ${error.message}`)
  }
}
