// Multi-Provider AI System - Support for OpenAI, Anthropic Claude, and more
// Similar to Perplexity's approach

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'auto'
export type AIModel =
  // OpenAI
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  // Anthropic
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'
  // Google
  | 'gemini-pro'
  | 'gemini-ultra'

export interface AIProviderConfig {
  provider: AIProvider
  model: AIModel
  apiKey: string
  maxTokens?: number
  temperature?: number
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICompletionRequest {
  messages: AIMessage[]
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

export interface AICompletionResponse {
  content: string
  model: string
  provider: AIProvider
  tokensUsed: {
    prompt: number
    completion: number
    total: number
  }
  finishReason: string
}

export interface AIStreamChunk {
  content: string
  done: boolean
}

// Provider-specific configurations
export const AI_PROVIDER_CONFIGS = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4-turbo',
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    costPer1kTokens: {
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    },
  },
  anthropic: {
    baseURL: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    costPer1kTokens: {
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    },
  },
  gemini: {
    baseURL: 'https://generativelanguage.googleapis.com/v1',
    defaultModel: 'gemini-pro',
    models: ['gemini-pro', 'gemini-ultra'],
    costPer1kTokens: {
      'gemini-pro': { input: 0.0005, output: 0.0015 },
      'gemini-ultra': { input: 0.01, output: 0.03 },
    },
  },
}

// Recommended models for each feature
export const FEATURE_MODEL_RECOMMENDATIONS = {
  expand: {
    best: 'claude-3-5-sonnet-20241022', // Best for creative writing
    good: ['gpt-4-turbo', 'claude-3-opus-20240229'],
    budget: 'claude-3-haiku-20240307',
  },
  rewrite: {
    best: 'claude-3-5-sonnet-20241022',
    good: ['gpt-4-turbo', 'claude-3-sonnet-20240229'],
    budget: 'gpt-3.5-turbo',
  },
  describe: {
    best: 'claude-3-opus-20240229', // Best for vivid descriptions
    good: ['claude-3-5-sonnet-20241022', 'gpt-4'],
    budget: 'claude-3-haiku-20240307',
  },
  brainstorm: {
    best: 'gpt-4-turbo', // Good for idea generation
    good: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    budget: 'gpt-3.5-turbo',
  },
  critique: {
    best: 'claude-3-opus-20240229', // Best for detailed analysis
    good: ['claude-3-5-sonnet-20241022', 'gpt-4'],
    budget: 'claude-3-sonnet-20240229',
  },
  character: {
    best: 'claude-3-5-sonnet-20241022',
    good: ['gpt-4-turbo', 'claude-3-opus-20240229'],
    budget: 'claude-3-haiku-20240307',
  },
  outline: {
    best: 'gpt-4-turbo',
    good: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    budget: 'gpt-3.5-turbo',
  },
}

// Auto-select best available model based on feature and user tier
export function selectBestModel(
  feature: keyof typeof FEATURE_MODEL_RECOMMENDATIONS,
  userTier: 'free' | 'pro' | 'premium' | 'enterprise',
  preferredProvider?: AIProvider
): { provider: AIProvider; model: AIModel } {
  const recommendations = FEATURE_MODEL_RECOMMENDATIONS[feature]

  if (userTier === 'free' || userTier === 'pro') {
    // Use budget-friendly models for free/pro users
    const budgetModel = recommendations.budget as AIModel
    const provider = getProviderForModel(budgetModel)
    return { provider, model: budgetModel }
  }

  if (userTier === 'premium' || userTier === 'enterprise') {
    // Premium users get best models
    if (preferredProvider && preferredProvider !== 'auto') {
      const providerModels = AI_PROVIDER_CONFIGS[preferredProvider].models
      const bestModelForProvider =
        recommendations.good.find(m => providerModels.includes(m)) || recommendations.best

      return {
        provider: preferredProvider,
        model: bestModelForProvider as AIModel,
      }
    }

    const bestModel = recommendations.best as AIModel
    const provider = getProviderForModel(bestModel)
    return { provider, model: bestModel }
  }

  // Default to best model
  const bestModel = recommendations.best as AIModel
  const provider = getProviderForModel(bestModel)
  return { provider, model: bestModel }
}

function getProviderForModel(model: AIModel): AIProvider {
  if (model.startsWith('gpt-')) return 'openai'
  if (model.startsWith('claude-')) return 'anthropic'
  if (model.startsWith('gemini-')) return 'gemini'
  return 'openai' // default
}

// Calculate cost for a request
export function calculateCost(
  provider: AIProvider,
  model: AIModel,
  tokensUsed: { prompt: number; completion: number }
): number {
  if (provider === 'auto') return 0

  const config = AI_PROVIDER_CONFIGS[provider]
  const costMap: any = config.costPer1kTokens
  const costs = costMap[model]

  if (!costs) return 0

  const promptCost = (tokensUsed.prompt / 1000) * costs.input
  const completionCost = (tokensUsed.completion / 1000) * costs.output

  return promptCost + completionCost
}

// Provider health check
export async function checkProviderHealth(provider: AIProvider): Promise<boolean> {
  try {
    // Simple health check - could ping API or check status page
    return true
  } catch {
    return false
  }
}

// Fallback chain - if primary fails, try alternatives
export const PROVIDER_FALLBACK_CHAIN: Record<AIProvider, AIProvider[]> = {
  openai: ['anthropic', 'gemini'],
  anthropic: ['openai', 'gemini'],
  gemini: ['anthropic', 'openai'],
  auto: ['anthropic', 'openai', 'gemini'],
}
