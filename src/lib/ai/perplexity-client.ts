// Perplexity AI Client - Real-time Research & Citations
import type { AICompletionRequest, AICompletionResponse } from './ai-provider'

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface PerplexityRequest {
  model: string
  messages: PerplexityMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  return_citations?: boolean
  return_images?: boolean
  search_domain_filter?: string[]
  search_recency_filter?: string
}

interface PerplexityResponse {
  id: string
  model: string
  object: string
  created: number
  choices: Array<{
    index: number
    finish_reason: string
    message: {
      role: string
      content: string
    }
    delta?: {
      role?: string
      content?: string
    }
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  citations?: string[]
  images?: string[]
}

function getPerplexityAPIKey(): string {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not configured')
  }
  return apiKey
}

/**
 * Call Perplexity Sonar API for research queries
 * Returns AI-generated answer with citations
 */
export async function callPerplexity(
  request: AICompletionRequest,
  model: string = 'llama-3.1-sonar-large-128k-online',
  options?: {
    returnCitations?: boolean
    returnImages?: boolean
    domainFilter?: string[]
    recencyFilter?: 'day' | 'week' | 'month' | 'year'
  }
): Promise<AICompletionResponse & { citations?: string[]; images?: string[] }> {
  try {
    const perplexityRequest: PerplexityRequest = {
      model,
      messages: request.messages as PerplexityMessage[],
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.2, // Lower temp for factual research
      top_p: 0.9,
      return_citations: options?.returnCitations ?? true,
      return_images: options?.returnImages ?? false,
    }

    // Add optional filters
    if (options?.domainFilter && options.domainFilter.length > 0) {
      perplexityRequest.search_domain_filter = options.domainFilter
    }

    if (options?.recencyFilter) {
      perplexityRequest.search_recency_filter = options.recencyFilter
    }

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getPerplexityAPIKey()}`,
      },
      body: JSON.stringify(perplexityRequest),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Perplexity API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      )
    }

    const data: PerplexityResponse = await response.json()

    const choice = data.choices[0]
    if (!choice) {
      throw new Error('No response from Perplexity API')
    }

    return {
      content: choice.message.content,
      model: data.model,
      provider: 'perplexity',
      finishReason: choice.finish_reason || 'stop',
      tokensUsed: {
        total: data.usage.total_tokens,
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
      },
      citations: data.citations,
      images: data.images,
    }
  } catch (error: any) {
    console.error('Perplexity API Error:', error)
    throw new Error(`Perplexity request failed: ${error.message}`)
  }
}

/**
 * Stream responses from Perplexity (for real-time research)
 */
export async function* streamPerplexity(
  request: AICompletionRequest,
  model: string = 'llama-3.1-sonar-large-128k-online',
  options?: {
    returnCitations?: boolean
    domainFilter?: string[]
    recencyFilter?: 'day' | 'week' | 'month' | 'year'
  }
): AsyncGenerator<{
  content: string
  isComplete: boolean
  citations?: string[]
}> {
  try {
    const perplexityRequest: PerplexityRequest = {
      model,
      messages: request.messages as PerplexityMessage[],
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.2,
      top_p: 0.9,
      return_citations: options?.returnCitations ?? true,
      return_images: false,
    }

    if (options?.domainFilter && options.domainFilter.length > 0) {
      perplexityRequest.search_domain_filter = options.domainFilter
    }

    if (options?.recencyFilter) {
      perplexityRequest.search_recency_filter = options.recencyFilter
    }

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getPerplexityAPIKey()}`,
      },
      body: JSON.stringify({
        ...perplexityRequest,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let citations: string[] = []

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            yield { content: '', isComplete: true, citations }
            return
          }

          try {
            const parsed: PerplexityResponse = JSON.parse(data)
            const delta = parsed.choices[0]?.delta

            if (delta?.content) {
              yield {
                content: delta.content,
                isComplete: false,
                citations: parsed.citations,
              }
            }

            if (parsed.citations) {
              citations = parsed.citations
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    yield { content: '', isComplete: true, citations }
  } catch (error: any) {
    console.error('Perplexity Streaming Error:', error)
    throw new Error(`Perplexity streaming failed: ${error.message}`)
  }
}

/**
 * Research helper: Quick fact-checking query
 */
export async function researchQuery(
  query: string,
  options?: {
    recencyFilter?: 'day' | 'week' | 'month' | 'year'
    domainFilter?: string[]
  }
): Promise<{ answer: string; citations: string[] }> {
  const response = await callPerplexity(
    {
      messages: [
        {
          role: 'system',
          content:
            'You are a research assistant helping fiction writers with accurate, well-cited information. Provide concise, factual answers with proper context.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      maxTokens: 1000,
      temperature: 0.2,
    },
    'llama-3.1-sonar-large-128k-online',
    {
      returnCitations: true,
      returnImages: false,
      ...options,
    }
  )

  return {
    answer: response.content,
    citations: response.citations || [],
  }
}
