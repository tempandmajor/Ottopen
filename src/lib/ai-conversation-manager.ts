/**
 * AI Conversation Manager
 *
 * Manages stateful AI conversations for:
 * - OpenAI Responses API
 * - Claude Memory Tool
 * - DeepSeek context caching
 * - Gemini session resumption
 *
 * Provides automatic conversation tracking, memory persistence,
 * and cache optimization across writing sessions.
 */

import { createClient } from '@supabase/supabase-js'

// Lazy getter for Supabase client
let _supabaseClient: ReturnType<typeof createClient> | null = null
function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase client not configured')
  }

  _supabaseClient = createClient(supabaseUrl, serviceRoleKey)
  return _supabaseClient
}

const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getSupabaseClient()
    return client[prop as keyof typeof client]
  },
})

export type AIProvider = 'openai' | 'claude' | 'deepseek' | 'gemini'
export type ContextType = 'character' | 'plot' | 'research' | 'general' | 'brainstorm'
export type MemoryType = 'character' | 'plot' | 'world' | 'research' | 'style' | 'fact'

export interface AIConversation {
  id: string
  scriptId: string
  userId: string
  provider: AIProvider
  conversationId: string // Provider-specific ID
  contextType: ContextType
  totalTokens: number
  totalRequests: number
  lastRequestAt: Date | null
  createdAt: Date
  updatedAt: Date
  metadata: Record<string, any>
}

export interface AIMemory {
  id: string
  conversationId: string
  memoryType: MemoryType
  content: string
  summary?: string
  createdAt: Date
  updatedAt: Date
  accessedAt: Date
  expiresAt?: Date
  metadata: Record<string, any>
}

export interface CacheStats {
  cacheHits: number
  cacheMisses: number
  tokensCached: number
  tokensSaved: number
  costSavedUsd: number
  avgLatencyMs: number
  requestsCount: number
}

/**
 * Get or create a conversation for a script/user/provider/context
 */
export async function getOrCreateConversation(
  scriptId: string,
  userId: string,
  provider: AIProvider,
  contextType: ContextType = 'general'
): Promise<AIConversation> {
  // Try to find existing conversation
  const { data: existing, error: fetchError } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('script_id', scriptId)
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('context_type', contextType)
    .single()

  if (existing && !fetchError) {
    return {
      id: existing.id,
      scriptId: existing.script_id,
      userId: existing.user_id,
      provider: existing.provider,
      conversationId: existing.conversation_id,
      contextType: existing.context_type,
      totalTokens: existing.total_tokens || 0,
      totalRequests: existing.total_requests || 0,
      lastRequestAt: existing.last_request_at ? new Date(existing.last_request_at) : null,
      createdAt: new Date(existing.created_at),
      updatedAt: new Date(existing.updated_at),
      metadata: existing.metadata || {},
    }
  }

  // Create new conversation
  const conversationId = `${provider}-${scriptId}-${contextType}-${Date.now()}`

  const { data: created, error: createError } = await supabase
    .from('ai_conversations')
    .insert({
      script_id: scriptId,
      user_id: userId,
      provider,
      conversation_id: conversationId,
      context_type: contextType,
    })
    .select()
    .single()

  if (createError) {
    throw new Error(`Failed to create conversation: ${createError.message}`)
  }

  return {
    id: created.id,
    scriptId: created.script_id,
    userId: created.user_id,
    provider: created.provider,
    conversationId: created.conversation_id,
    contextType: created.context_type,
    totalTokens: 0,
    totalRequests: 0,
    lastRequestAt: null,
    createdAt: new Date(created.created_at),
    updatedAt: new Date(created.updated_at),
    metadata: created.metadata || {},
  }
}

/**
 * Update conversation stats after an AI request
 */
export async function updateConversationStats(
  conversationId: string,
  tokens: number,
  metadata?: Record<string, any>
): Promise<void> {
  const updates: any = {
    total_tokens: supabase.rpc('increment', { column: 'total_tokens', amount: tokens }),
    total_requests: supabase.rpc('increment', { column: 'total_requests', amount: 1 }),
    last_request_at: new Date().toISOString(),
  }

  if (metadata) {
    updates.metadata = metadata
  }

  const { error } = await supabase.from('ai_conversations').update(updates).eq('id', conversationId)

  if (error) {
    console.error('[ConversationManager] Failed to update stats:', error)
  }
}

/**
 * Store a memory for Claude Memory Tool or context persistence
 */
export async function storeMemory(
  conversationId: string,
  memoryType: MemoryType,
  content: string,
  options: {
    summary?: string
    expiresAt?: Date
    metadata?: Record<string, any>
  } = {}
): Promise<AIMemory> {
  const { data, error } = await supabase
    .from('ai_memory_store')
    .insert({
      conversation_id: conversationId,
      memory_type: memoryType,
      content,
      summary: options.summary,
      expires_at: options.expiresAt?.toISOString(),
      metadata: options.metadata || {},
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to store memory: ${error.message}`)
  }

  return {
    id: data.id,
    conversationId: data.conversation_id,
    memoryType: data.memory_type,
    content: data.content,
    summary: data.summary,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    accessedAt: new Date(data.accessed_at),
    expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    metadata: data.metadata || {},
  }
}

/**
 * Retrieve memories for a conversation (filtered by type)
 */
export async function getMemories(
  conversationId: string,
  memoryType?: MemoryType
): Promise<AIMemory[]> {
  let query = supabase
    .from('ai_memory_store')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('accessed_at', { ascending: false })

  if (memoryType) {
    query = query.eq('memory_type', memoryType)
  }

  const { data, error } = await query

  if (error) {
    console.error('[ConversationManager] Failed to fetch memories:', error)
    return []
  }

  // Update accessed_at timestamps
  const ids = data.map(m => m.id)
  if (ids.length > 0) {
    await supabase
      .from('ai_memory_store')
      .update({ accessed_at: new Date().toISOString() })
      .in('id', ids)
  }

  return data.map(m => ({
    id: m.id,
    conversationId: m.conversation_id,
    memoryType: m.memory_type,
    content: m.content,
    summary: m.summary,
    createdAt: new Date(m.created_at),
    updatedAt: new Date(m.updated_at),
    accessedAt: new Date(m.accessed_at),
    expiresAt: m.expires_at ? new Date(m.expires_at) : undefined,
    metadata: m.metadata || {},
  }))
}

/**
 * Update a memory
 */
export async function updateMemory(
  memoryId: string,
  updates: {
    content?: string
    summary?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  const { error } = await supabase
    .from('ai_memory_store')
    .update({
      ...updates,
      accessed_at: new Date().toISOString(),
    })
    .eq('id', memoryId)

  if (error) {
    throw new Error(`Failed to update memory: ${error.message}`)
  }
}

/**
 * Delete a memory
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  const { error } = await supabase.from('ai_memory_store').delete().eq('id', memoryId)

  if (error) {
    throw new Error(`Failed to delete memory: ${error.message}`)
  }
}

/**
 * Record cache statistics for monitoring
 */
export async function recordCacheStats(
  scriptId: string,
  userId: string,
  provider: AIProvider,
  stats: {
    cacheHits?: number
    cacheMisses?: number
    tokensCached?: number
    tokensSaved?: number
    costSavedUsd?: number
    latencyMs?: number
  }
): Promise<void> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Upsert cache stats for today
  const { error } = await supabase.from('ai_cache_stats').upsert(
    {
      script_id: scriptId,
      user_id: userId,
      provider,
      date: today,
      cache_hits: stats.cacheHits || 0,
      cache_misses: stats.cacheMisses || 0,
      tokens_cached: stats.tokensCached || 0,
      tokens_saved: stats.tokensSaved || 0,
      cost_saved_usd: stats.costSavedUsd || 0,
      avg_latency_ms: stats.latencyMs || 0,
      requests_count: 1,
    },
    {
      onConflict: 'script_id,user_id,provider,date',
      // Increment existing values
    }
  )

  if (error) {
    console.error('[ConversationManager] Failed to record cache stats:', error)
  }
}

/**
 * Get cache statistics for a script/user
 */
export async function getCacheStats(
  scriptId: string,
  userId: string,
  provider?: AIProvider
): Promise<CacheStats> {
  let query = supabase
    .from('ai_cache_stats')
    .select('*')
    .eq('script_id', scriptId)
    .eq('user_id', userId)

  if (provider) {
    query = query.eq('provider', provider)
  }

  const { data, error } = await query

  if (error || !data || data.length === 0) {
    return {
      cacheHits: 0,
      cacheMisses: 0,
      tokensCached: 0,
      tokensSaved: 0,
      costSavedUsd: 0,
      avgLatencyMs: 0,
      requestsCount: 0,
    }
  }

  // Aggregate across all records
  return data.reduce(
    (acc, row) => ({
      cacheHits: acc.cacheHits + (row.cache_hits || 0),
      cacheMisses: acc.cacheMisses + (row.cache_misses || 0),
      tokensCached: acc.tokensCached + (row.tokens_cached || 0),
      tokensSaved: acc.tokensSaved + (row.tokens_saved || 0),
      costSavedUsd: acc.costSavedUsd + parseFloat(row.cost_saved_usd || '0'),
      avgLatencyMs: acc.avgLatencyMs + (row.avg_latency_ms || 0),
      requestsCount: acc.requestsCount + (row.requests_count || 0),
    }),
    {
      cacheHits: 0,
      cacheMisses: 0,
      tokensCached: 0,
      tokensSaved: 0,
      costSavedUsd: 0,
      avgLatencyMs: 0,
      requestsCount: 0,
    }
  )
}

/**
 * Cleanup expired memories (run periodically)
 */
export async function cleanupExpiredMemories(): Promise<number> {
  const { data, error } = await supabase.rpc('cleanup_expired_ai_memories')

  if (error) {
    console.error('[ConversationManager] Failed to cleanup memories:', error)
    return 0
  }

  return data || 0
}

/**
 * Get all conversations for a script (for debugging/admin)
 */
export async function getScriptConversations(scriptId: string): Promise<AIConversation[]> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('script_id', scriptId)
    .order('updated_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.map(row => ({
    id: row.id,
    scriptId: row.script_id,
    userId: row.user_id,
    provider: row.provider,
    conversationId: row.conversation_id,
    contextType: row.context_type,
    totalTokens: row.total_tokens || 0,
    totalRequests: row.total_requests || 0,
    lastRequestAt: row.last_request_at ? new Date(row.last_request_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    metadata: row.metadata || {},
  }))
}
