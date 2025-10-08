/**
 * OpenAI Responses API Implementation
 *
 * Provides stateful AI conversations using OpenAI's Responses API.
 * Benefits over Chat Completions:
 * - 5% better quality (preserved reasoning state)
 * - 40-80% better cache utilization
 * - Lower latency and costs
 * - Built-in tools (web search, file search, code interpreter)
 * - Automatic conversation state management
 *
 * Endpoint: /v1/responses (vs /v1/chat/completions)
 */

import OpenAI from 'openai'
import {
  getOrCreateConversation,
  updateConversationStats,
  type AIProvider,
  type ContextType,
} from './ai-conversation-manager'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export interface ResponsesAPIRequest {
  scriptId: string
  userId: string
  message: string
  contextType?: ContextType
  model?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
  tools?: Array<'web_search' | 'file_search' | 'code_interpreter'>
}

export interface ResponsesAPIResult {
  content: string
  conversationId: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    cachedTokens?: number
  }
  toolCalls?: Array<{
    id: string
    type: string
    function?: {
      name: string
      arguments: string
    }
  }>
}

export type ResponsesAPIStreamResult = AsyncIterable<string>

/**
 * Generate AI response using OpenAI Responses API (stateful)
 */
export async function generateWithResponsesAPI(
  request: ResponsesAPIRequest
): Promise<ResponsesAPIResult | ResponsesAPIStreamResult> {
  if (!openai) {
    throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY.')
  }

  // Get or create conversation for this script/user/context
  const conversation = await getOrCreateConversation(
    request.scriptId,
    request.userId,
    'openai',
    request.contextType || 'general'
  )

  const startTime = Date.now()

  try {
    // Note: As of October 2025, the Responses API is accessed via a different endpoint
    // This is a reference implementation - adjust based on actual API structure
    const response = await (openai as any).responses.create({
      model: request.model || 'gpt-5',
      conversation_id: conversation.conversationId,
      message: request.message,
      max_tokens: request.maxTokens || 4000,
      temperature: request.temperature !== undefined ? request.temperature : 0.7,
      stream: request.stream || false,
      tools: request.tools || [],
    })

    const latency = Date.now() - startTime

    if (request.stream) {
      // Return streaming response
      return streamResponsesAPIResult(response, conversation.id, latency)
    }

    // Parse non-streaming response
    const content = response.message?.content || ''
    const usage = response.usage || {}

    // Update conversation stats
    await updateConversationStats(conversation.id, usage.total_tokens || 0, {
      last_model: request.model || 'gpt-5',
      last_latency_ms: latency,
    })

    return {
      content,
      conversationId: conversation.conversationId,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        cachedTokens: usage.cached_tokens || 0,
      },
      toolCalls: response.tool_calls || [],
    }
  } catch (error: any) {
    console.error('[ResponsesAPI] Error:', error)

    // Fallback to Chat Completions if Responses API not available
    if (error.message?.includes('responses') || error.status === 404) {
      console.warn('[ResponsesAPI] Falling back to Chat Completions API')
      return generateWithChatCompletionsFallback(request, conversation.conversationId)
    }

    throw error
  }
}

/**
 * Stream Responses API result
 */
async function* streamResponsesAPIResult(
  stream: any,
  conversationId: string,
  latency: number
): ResponsesAPIStreamResult {
  let totalTokens = 0

  for await (const chunk of stream) {
    const content = chunk.message?.content || chunk.delta?.content || ''

    if (content) {
      yield content
    }

    // Track tokens if available
    if (chunk.usage) {
      totalTokens = chunk.usage.total_tokens || 0
    }
  }

  // Update stats after streaming completes
  if (totalTokens > 0) {
    await updateConversationStats(conversationId, totalTokens, { last_latency_ms: latency })
  }
}

/**
 * Fallback to Chat Completions API if Responses API not available
 */
async function generateWithChatCompletionsFallback(
  request: ResponsesAPIRequest,
  conversationId: string
): Promise<ResponsesAPIResult> {
  if (!openai) {
    throw new Error('OpenAI client not initialized')
  }

  const startTime = Date.now()

  const response = await openai.chat.completions.create({
    model: request.model || 'gpt-5',
    messages: [{ role: 'user', content: request.message }],
    max_tokens: request.maxTokens || 4000,
    temperature: request.temperature !== undefined ? request.temperature : 0.7,
  })

  const latency = Date.now() - startTime
  const content = response.choices[0]?.message?.content || ''

  // Update conversation stats
  await updateConversationStats(conversationId, response.usage?.total_tokens || 0, {
    last_model: request.model || 'gpt-5',
    last_latency_ms: latency,
    fallback: 'chat_completions',
  })

  return {
    content,
    conversationId,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  }
}

/**
 * Continue a conversation with additional context
 */
export async function continueConversation(
  scriptId: string,
  userId: string,
  message: string,
  contextType?: ContextType
): Promise<ResponsesAPIResult> {
  return generateWithResponsesAPI({
    scriptId,
    userId,
    message,
    contextType,
  }) as Promise<ResponsesAPIResult>
}

/**
 * Start a new brainstorming session
 */
export async function startBrainstorm(
  scriptId: string,
  userId: string,
  prompt: string
): Promise<ResponsesAPIResult> {
  return generateWithResponsesAPI({
    scriptId,
    userId,
    message: prompt,
    contextType: 'brainstorm',
    temperature: 0.9, // Higher creativity for brainstorming
  }) as Promise<ResponsesAPIResult>
}

/**
 * Research with web search tool
 */
export async function researchWithWebSearch(
  scriptId: string,
  userId: string,
  query: string
): Promise<ResponsesAPIResult> {
  return generateWithResponsesAPI({
    scriptId,
    userId,
    message: query,
    contextType: 'research',
    tools: ['web_search'],
  }) as Promise<ResponsesAPIResult>
}

/**
 * Analyze characters with conversation context
 */
export async function analyzeCharacter(
  scriptId: string,
  userId: string,
  characterName: string,
  question: string
): Promise<ResponsesAPIResult> {
  return generateWithResponsesAPI({
    scriptId,
    userId,
    message: `Regarding character ${characterName}: ${question}`,
    contextType: 'character',
  }) as Promise<ResponsesAPIResult>
}

/**
 * Track plot development
 */
export async function developPlot(
  scriptId: string,
  userId: string,
  plotQuery: string
): Promise<ResponsesAPIResult> {
  return generateWithResponsesAPI({
    scriptId,
    userId,
    message: plotQuery,
    contextType: 'plot',
  }) as Promise<ResponsesAPIResult>
}
