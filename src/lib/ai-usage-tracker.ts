/**
 * AI Usage Tracking Service
 * Tracks token usage, costs, and enforces limits
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface TokenUsage {
  total: number
  prompt: number
  completion: number
}

interface AIUsageRecord {
  id: string
  user_id: string
  feature: string
  provider: string
  model: string
  tokens_used: number
  cost_usd: number
  created_at: string
}

interface UsageLimits {
  daily_tokens: number
  monthly_tokens: number
  daily_cost_usd: number
  monthly_cost_usd: number
}

// Token costs per model (per 1K tokens)
const TOKEN_COSTS = {
  'gpt-5-turbo': { prompt: 0.005, completion: 0.015 },
  'gpt-5': { prompt: 0.01, completion: 0.03 },
  'claude-4.5-sonnet': { prompt: 0.002, completion: 0.01 },
  'claude-4.5-opus': { prompt: 0.01, completion: 0.05 },
  // Perplexity (Research models)
  'llama-3.1-sonar-large-128k-online': { prompt: 0.001, completion: 0.001 },
  'llama-3.1-sonar-small-128k-online': { prompt: 0.0002, completion: 0.0002 },
  'llama-3.1-sonar-huge-128k-online': { prompt: 0.005, completion: 0.005 },
  // Legacy models (deprecated)
  'openai-gpt4': { prompt: 0.03, completion: 0.06 },
  'openai-gpt3.5': { prompt: 0.0015, completion: 0.002 },
  'anthropic-claude': { prompt: 0.008, completion: 0.024 },
  'anthropic-claude-instant': { prompt: 0.0008, completion: 0.0024 },
} as const

// Default limits for free tier
const DEFAULT_LIMITS: UsageLimits = {
  daily_tokens: 50000, // 50K tokens per day
  monthly_tokens: 500000, // 500K tokens per month
  daily_cost_usd: 5.0, // $5 per day
  monthly_cost_usd: 50.0, // $50 per month
}

export class AIUsageTracker {
  private supabase = createClientComponentClient()

  /**
   * Calculate cost for token usage
   */
  calculateCost(model: string, tokenUsage: TokenUsage): number {
    const costs = TOKEN_COSTS[model as keyof typeof TOKEN_COSTS]
    if (!costs) return 0

    const promptCost = (tokenUsage.prompt / 1000) * costs.prompt
    const completionCost = (tokenUsage.completion / 1000) * costs.completion

    return promptCost + completionCost
  }

  /**
   * Record AI usage
   */
  async recordUsage(
    userId: string,
    feature: string,
    provider: string,
    model: string,
    tokenUsage: TokenUsage
  ): Promise<void> {
    const cost = this.calculateCost(model, tokenUsage)

    const { error } = await this.supabase.from('ai_usage').insert({
      user_id: userId,
      feature,
      provider,
      model,
      tokens_used: tokenUsage.total,
      tokens_prompt: tokenUsage.prompt,
      tokens_completion: tokenUsage.completion,
      cost_usd: cost,
    })

    if (error) {
      console.error('Failed to record AI usage:', error)
      throw error
    }
  }

  /**
   * Get usage for a time period
   */
  async getUsage(
    userId: string,
    period: 'day' | 'month'
  ): Promise<{ tokens: number; cost: number }> {
    const now = new Date()
    let startDate: Date

    if (period === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const { data, error } = await this.supabase
      .from('ai_usage')
      .select('tokens_used, cost_usd')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('Failed to get AI usage:', error)
      return { tokens: 0, cost: 0 }
    }

    const tokens = data.reduce((sum, record) => sum + record.tokens_used, 0)
    const cost = data.reduce((sum, record) => sum + record.cost_usd, 0)

    return { tokens, cost }
  }

  /**
   * Check if user is within limits
   */
  async checkLimits(
    userId: string,
    requestedTokens: number = 0
  ): Promise<{
    allowed: boolean
    reason?: string
    usage: {
      daily: { tokens: number; cost: number }
      monthly: { tokens: number; cost: number }
    }
    limits: UsageLimits
  }> {
    // Get user's limits (would come from subscription tier in production)
    const limits = DEFAULT_LIMITS

    // Get current usage
    const dailyUsage = await this.getUsage(userId, 'day')
    const monthlyUsage = await this.getUsage(userId, 'month')

    // Check daily limits
    if (dailyUsage.tokens + requestedTokens > limits.daily_tokens) {
      return {
        allowed: false,
        reason: `Daily token limit reached (${limits.daily_tokens.toLocaleString()} tokens)`,
        usage: { daily: dailyUsage, monthly: monthlyUsage },
        limits,
      }
    }

    if (dailyUsage.cost > limits.daily_cost_usd) {
      return {
        allowed: false,
        reason: `Daily cost limit reached ($${limits.daily_cost_usd})`,
        usage: { daily: dailyUsage, monthly: monthlyUsage },
        limits,
      }
    }

    // Check monthly limits
    if (monthlyUsage.tokens + requestedTokens > limits.monthly_tokens) {
      return {
        allowed: false,
        reason: `Monthly token limit reached (${limits.monthly_tokens.toLocaleString()} tokens)`,
        usage: { daily: dailyUsage, monthly: monthlyUsage },
        limits,
      }
    }

    if (monthlyUsage.cost > limits.monthly_cost_usd) {
      return {
        allowed: false,
        reason: `Monthly cost limit reached ($${limits.monthly_cost_usd})`,
        usage: { daily: dailyUsage, monthly: monthlyUsage },
        limits,
      }
    }

    return {
      allowed: true,
      usage: { daily: dailyUsage, monthly: monthlyUsage },
      limits,
    }
  }

  /**
   * Get usage statistics
   */
  async getStats(userId: string): Promise<{
    today: { tokens: number; cost: number; requests: number }
    thisMonth: { tokens: number; cost: number; requests: number }
    byFeature: Record<string, { tokens: number; cost: number; requests: number }>
    byModel: Record<string, { tokens: number; cost: number; requests: number }>
  }> {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const { data, error } = await this.supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    if (error || !data) {
      return {
        today: { tokens: 0, cost: 0, requests: 0 },
        thisMonth: { tokens: 0, cost: 0, requests: 0 },
        byFeature: {},
        byModel: {},
      }
    }

    const todayData = data.filter(r => new Date(r.created_at) >= startOfDay)

    const today = {
      tokens: todayData.reduce((sum, r) => sum + r.tokens_used, 0),
      cost: todayData.reduce((sum, r) => sum + r.cost_usd, 0),
      requests: todayData.length,
    }

    const thisMonth = {
      tokens: data.reduce((sum, r) => sum + r.tokens_used, 0),
      cost: data.reduce((sum, r) => sum + r.cost_usd, 0),
      requests: data.length,
    }

    const byFeature: Record<string, { tokens: number; cost: number; requests: number }> = {}
    const byModel: Record<string, { tokens: number; cost: number; requests: number }> = {}

    data.forEach(record => {
      // By feature
      if (!byFeature[record.feature]) {
        byFeature[record.feature] = { tokens: 0, cost: 0, requests: 0 }
      }
      byFeature[record.feature].tokens += record.tokens_used
      byFeature[record.feature].cost += record.cost_usd
      byFeature[record.feature].requests += 1

      // By model
      if (!byModel[record.model]) {
        byModel[record.model] = { tokens: 0, cost: 0, requests: 0 }
      }
      byModel[record.model].tokens += record.tokens_used
      byModel[record.model].cost += record.cost_usd
      byModel[record.model].requests += 1
    })

    return { today, thisMonth, byFeature, byModel }
  }
}

// Singleton instance
export const aiUsageTracker = new AIUsageTracker()
