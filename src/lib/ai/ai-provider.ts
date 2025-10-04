// Multi-Provider AI System - Support for OpenAI, Anthropic Claude, and more
// Similar to Perplexity's approach

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'perplexity' | 'auto'
export type AIModel =
  // OpenAI
  | 'gpt-5-turbo'
  | 'gpt-5'
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  // Anthropic
  | 'claude-4.5-sonnet-20250101'
  | 'claude-4.5-opus-20250101'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'
  // Google
  | 'gemini-pro'
  | 'gemini-ultra'
  // Perplexity (Research-focused)
  | 'llama-3.1-sonar-large-128k-online'
  | 'llama-3.1-sonar-small-128k-online'
  | 'llama-3.1-sonar-huge-128k-online'

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
    defaultModel: 'gpt-5-turbo',
    models: ['gpt-5-turbo', 'gpt-5', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    costPer1kTokens: {
      'gpt-5-turbo': { input: 0.005, output: 0.015 },
      'gpt-5': { input: 0.01, output: 0.03 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    },
  },
  anthropic: {
    baseURL: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-4.5-sonnet-20250101',
    models: [
      'claude-4.5-sonnet-20250101',
      'claude-4.5-opus-20250101',
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    costPer1kTokens: {
      'claude-4.5-sonnet-20250101': { input: 0.002, output: 0.01 },
      'claude-4.5-opus-20250101': { input: 0.01, output: 0.05 },
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
  perplexity: {
    baseURL: 'https://api.perplexity.ai',
    defaultModel: 'llama-3.1-sonar-large-128k-online',
    models: [
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-huge-128k-online',
    ],
    costPer1kTokens: {
      'llama-3.1-sonar-large-128k-online': { input: 0.001, output: 0.001 },
      'llama-3.1-sonar-small-128k-online': { input: 0.0002, output: 0.0002 },
      'llama-3.1-sonar-huge-128k-online': { input: 0.005, output: 0.005 },
    },
  },
}

// Recommended models for each feature
export const FEATURE_MODEL_RECOMMENDATIONS = {
  expand: {
    best: 'claude-4.5-sonnet-20250101', // Best for creative writing
    good: ['gpt-5-turbo', 'claude-4.5-opus-20250101'],
    budget: 'claude-3-haiku-20240307',
  },
  rewrite: {
    best: 'claude-4.5-sonnet-20250101',
    good: ['gpt-5-turbo', 'claude-3-5-sonnet-20241022'],
    budget: 'gpt-3.5-turbo',
  },
  describe: {
    best: 'claude-4.5-opus-20250101', // Best for vivid descriptions
    good: ['claude-4.5-sonnet-20250101', 'gpt-5'],
    budget: 'claude-3-haiku-20240307',
  },
  brainstorm: {
    best: 'gpt-5-turbo', // Good for idea generation
    good: ['claude-4.5-sonnet-20250101', 'claude-4.5-opus-20250101'],
    budget: 'gpt-3.5-turbo',
  },
  critique: {
    best: 'claude-4.5-opus-20250101', // Best for detailed analysis
    good: ['claude-4.5-sonnet-20250101', 'gpt-5'],
    budget: 'claude-3-sonnet-20240229',
  },
  character: {
    best: 'claude-4.5-sonnet-20250101',
    good: ['gpt-5-turbo', 'claude-4.5-opus-20250101'],
    budget: 'claude-3-haiku-20240307',
  },
  outline: {
    best: 'gpt-5-turbo',
    good: ['claude-4.5-sonnet-20250101', 'claude-4.5-opus-20250101'],
    budget: 'gpt-3.5-turbo',
  },
  research: {
    best: 'llama-3.1-sonar-large-128k-online', // Perplexity for real-time research
    good: ['llama-3.1-sonar-huge-128k-online'],
    budget: 'llama-3.1-sonar-small-128k-online',
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
  if (model.startsWith('llama-') && model.includes('sonar')) return 'perplexity'
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
  perplexity: ['openai', 'anthropic'], // Perplexity is research-only, fallback to general AI
  auto: ['anthropic', 'openai', 'gemini', 'perplexity'],
}
