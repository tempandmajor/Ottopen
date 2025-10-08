/**
 * Claude Memory Tool Implementation
 *
 * Implements Anthropic's Memory Tool for Claude to store and retrieve
 * information outside the context window.
 *
 * Benefits:
 * - Persistent character profiles across sessions
 * - Plot thread tracking over months-long projects
 * - World-building details stored separately
 * - Research notes accessible anytime
 * - 1M token context window support
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  getOrCreateConversation,
  updateConversationStats,
  storeMemory,
  getMemories,
  updateMemory,
  deleteMemory,
  type MemoryType,
  type ContextType,
} from './ai-conversation-manager'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export interface ClaudeMemoryRequest {
  scriptId: string
  userId: string
  message: string
  contextType?: ContextType
  model?: string
  maxTokens?: number
  temperature?: number
  includeMemory?: boolean // Whether to load memories into context
}

export interface ClaudeMemoryResult {
  content: string
  conversationId: string
  memoriesUsed: number
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Claude Memory Tool definition
 */
const memoryTool: Anthropic.Tool = {
  name: 'memory',
  description: `Store and manage persistent information about characters, plot, world-building, and research.

Use this tool to:
- Store character profiles (traits, backstory, relationships)
- Track plot threads and unresolved conflicts
- Remember world-building details (locations, rules, timelines)
- Save research notes and factual information
- Record narrative style and tone guidelines

The stored information will persist across all writing sessions.`,
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['store', 'retrieve', 'update', 'list'],
        description: 'Action to perform on memory',
      },
      memory_type: {
        type: 'string',
        enum: ['character', 'plot', 'world', 'research', 'style'],
        description: 'Type of memory to store/retrieve',
      },
      content: {
        type: 'string',
        description: 'Content to store or search query',
      },
      summary: {
        type: 'string',
        description: 'Optional short summary of the memory',
      },
    },
    required: ['action'],
  },
}

/**
 * Generate with Claude Memory Tool
 */
export async function generateWithClaudeMemory(
  request: ClaudeMemoryRequest
): Promise<ClaudeMemoryResult> {
  if (!anthropic) {
    throw new Error('Anthropic client not initialized. Set ANTHROPIC_API_KEY.')
  }

  // Get or create conversation
  const conversation = await getOrCreateConversation(
    request.scriptId,
    request.userId,
    'claude',
    request.contextType || 'general'
  )

  // Load existing memories if requested
  let memoryContext = ''
  let memoriesUsed = 0

  if (request.includeMemory !== false) {
    const memories = await getMemories(conversation.id)
    memoriesUsed = memories.length

    if (memories.length > 0) {
      memoryContext = `\n\nPERSISTENT MEMORY:\n${memories
        .map(m => `[${m.memoryType}] ${m.summary || m.content.substring(0, 200)}`)
        .join('\n')}\n\n`
    }
  }

  const startTime = Date.now()

  try {
    const response = await anthropic.messages.create({
      model: request.model || 'claude-sonnet-4-5',
      max_tokens: request.maxTokens || 4000,
      temperature: request.temperature !== undefined ? request.temperature : 0.7,
      tools: [memoryTool],
      messages: [
        {
          role: 'user',
          content: memoryContext + request.message,
        },
      ],
    })

    const latency = Date.now() - startTime

    // Process tool calls (memory operations)
    if (response.stop_reason === 'tool_use') {
      const toolCalls = response.content.filter(c => c.type === 'tool_use')

      for (const toolCall of toolCalls) {
        if (toolCall.type === 'tool_use' && toolCall.name === 'memory') {
          const input = toolCall.input as any
          await handleMemoryToolCall(conversation.id, input)
        }
      }

      // Continue conversation to get final response
      const finalResponse = await anthropic.messages.create({
        model: request.model || 'claude-sonnet-4-5',
        max_tokens: request.maxTokens || 4000,
        temperature: request.temperature !== undefined ? request.temperature : 0.7,
        tools: [memoryTool],
        messages: [
          {
            role: 'user',
            content: memoryContext + request.message,
          },
          {
            role: 'assistant',
            content: response.content,
          },
          {
            role: 'user',
            content: 'Memory operation completed. Please continue with your response.',
          },
        ],
      })

      const content =
        finalResponse.content.find(c => c.type === 'text')?.type === 'text'
          ? (finalResponse.content.find(c => c.type === 'text') as any).text
          : ''

      // Update stats
      const totalTokens =
        (response.usage?.input_tokens || 0) +
        (response.usage?.output_tokens || 0) +
        (finalResponse.usage?.input_tokens || 0) +
        (finalResponse.usage?.output_tokens || 0)

      await updateConversationStats(conversation.id, totalTokens, {
        last_model: request.model || 'claude-sonnet-4-5',
        last_latency_ms: latency,
        memory_operations: toolCalls.length,
      })

      return {
        content,
        conversationId: conversation.conversationId,
        memoriesUsed,
        usage: {
          promptTokens:
            (response.usage?.input_tokens || 0) + (finalResponse.usage?.input_tokens || 0),
          completionTokens:
            (response.usage?.output_tokens || 0) + (finalResponse.usage?.output_tokens || 0),
          totalTokens,
        },
      }
    }

    // No tool calls - return direct response
    const content =
      response.content.find(c => c.type === 'text')?.type === 'text'
        ? (response.content.find(c => c.type === 'text') as any).text
        : ''

    await updateConversationStats(
      conversation.id,
      (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      {
        last_model: request.model || 'claude-sonnet-4-5',
        last_latency_ms: latency,
      }
    )

    return {
      content,
      conversationId: conversation.conversationId,
      memoriesUsed,
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
    }
  } catch (error: any) {
    console.error('[ClaudeMemory] Error:', error)
    throw error
  }
}

/**
 * Handle memory tool calls
 */
async function handleMemoryToolCall(
  conversationId: string,
  input: {
    action: 'store' | 'retrieve' | 'update' | 'list'
    memory_type?: MemoryType
    content?: string
    summary?: string
  }
): Promise<void> {
  try {
    switch (input.action) {
      case 'store':
        if (input.content && input.memory_type) {
          await storeMemory(conversationId, input.memory_type, input.content, {
            summary: input.summary,
          })
          console.log(`[ClaudeMemory] Stored ${input.memory_type} memory`)
        }
        break

      case 'retrieve':
      case 'list':
        const memories = await getMemories(conversationId, input.memory_type)
        console.log(`[ClaudeMemory] Retrieved ${memories.length} memories`)
        break

      case 'update':
        // Update would require memory ID - simplified for now
        console.log('[ClaudeMemory] Update operation requested')
        break

      default:
        console.warn('[ClaudeMemory] Unknown action:', input.action)
    }
  } catch (error) {
    console.error('[ClaudeMemory] Tool call error:', error)
  }
}

/**
 * Explicitly store a character profile
 */
export async function storeCharacterProfile(
  scriptId: string,
  userId: string,
  characterName: string,
  profile: string
): Promise<void> {
  const conversation = await getOrCreateConversation(scriptId, userId, 'claude', 'character')

  await storeMemory(conversation.id, 'character', profile, {
    summary: `Character: ${characterName}`,
  })
}

/**
 * Retrieve all character profiles
 */
export async function getCharacterProfiles(scriptId: string, userId: string): Promise<string[]> {
  const conversation = await getOrCreateConversation(scriptId, userId, 'claude', 'character')
  const memories = await getMemories(conversation.id, 'character')

  return memories.map(m => m.content)
}

/**
 * Store a plot thread
 */
export async function storePlotThread(
  scriptId: string,
  userId: string,
  plotDescription: string,
  status: 'unresolved' | 'in-progress' | 'resolved' = 'unresolved'
): Promise<void> {
  const conversation = await getOrCreateConversation(scriptId, userId, 'claude', 'plot')

  await storeMemory(conversation.id, 'plot', plotDescription, {
    summary: `Plot thread (${status})`,
    metadata: { status },
  })
}

/**
 * Get all plot threads
 */
export async function getPlotThreads(scriptId: string, userId: string): Promise<string[]> {
  const conversation = await getOrCreateConversation(scriptId, userId, 'claude', 'plot')
  const memories = await getMemories(conversation.id, 'plot')

  return memories.map(m => `${m.summary}: ${m.content}`)
}

/**
 * Store world-building details
 */
export async function storeWorldBuilding(
  scriptId: string,
  userId: string,
  details: string,
  category: string
): Promise<void> {
  const conversation = await getOrCreateConversation(scriptId, userId, 'claude', 'general')

  await storeMemory(conversation.id, 'world', details, {
    summary: `World-building: ${category}`,
  })
}

/**
 * Store research notes
 */
export async function storeResearch(
  scriptId: string,
  userId: string,
  research: string,
  topic: string
): Promise<void> {
  const conversation = await getOrCreateConversation(scriptId, userId, 'claude', 'research')

  await storeMemory(conversation.id, 'research', research, {
    summary: `Research: ${topic}`,
  })
}
