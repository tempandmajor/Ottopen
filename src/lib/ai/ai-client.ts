// Unified AI Client - Multi-Provider Support (like Perplexity)
import { callOpenAI, streamOpenAI } from './openai-client'
import { callAnthropic, streamAnthropic } from './anthropic-client'
import type {
  AIProvider,
  AIModel,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
} from './ai-provider'
import {
  selectBestModel,
  PROVIDER_FALLBACK_CHAIN,
  checkProviderHealth,
  calculateCost,
} from './ai-provider'

export class AIClient {
  private userTier: 'free' | 'pro' | 'premium' | 'enterprise'
  private preferredProvider?: AIProvider

  constructor(
    userTier: 'free' | 'pro' | 'premium' | 'enterprise' = 'free',
    preferredProvider?: AIProvider
  ) {
    this.userTier = userTier
    this.preferredProvider = preferredProvider
  }

  /**
   * Complete a prompt with automatic provider selection and fallback
   */
  async complete(
    request: AICompletionRequest,
    feature: string = 'expand',
    explicitModel?: { provider: AIProvider; model: AIModel }
  ): Promise<AICompletionResponse> {
    const selectedModel =
      explicitModel || selectBestModel(feature as any, this.userTier, this.preferredProvider)

    try {
      return await this.callProvider(selectedModel.provider, selectedModel.model, request)
    } catch (error) {
      console.error(`Primary provider ${selectedModel.provider} failed, trying fallback...`)

      // Try fallback providers
      const fallbacks = PROVIDER_FALLBACK_CHAIN[selectedModel.provider]
      for (const fallbackProvider of fallbacks) {
        try {
          const fallbackModel = this.getDefaultModelForProvider(fallbackProvider)
          return await this.callProvider(fallbackProvider, fallbackModel, request)
        } catch (fallbackError) {
          console.error(`Fallback provider ${fallbackProvider} also failed`)
          continue
        }
      }

      throw new Error('All AI providers failed')
    }
  }

  /**
   * Stream completion with automatic provider selection
   */
  async *stream(
    request: AICompletionRequest,
    feature: string = 'expand',
    explicitModel?: { provider: AIProvider; model: AIModel }
  ): AsyncGenerator<AIStreamChunk> {
    const selectedModel =
      explicitModel || selectBestModel(feature as any, this.userTier, this.preferredProvider)

    try {
      yield* this.streamProvider(selectedModel.provider, selectedModel.model, request)
    } catch (error) {
      console.error(`Streaming failed for ${selectedModel.provider}`)
      throw error
    }
  }

  /**
   * Call specific provider
   */
  private async callProvider(
    provider: AIProvider,
    model: AIModel,
    request: AICompletionRequest
  ): Promise<AICompletionResponse> {
    switch (provider) {
      case 'openai':
        return await callOpenAI(request, model)
      case 'anthropic':
        return await callAnthropic(request, model)
      case 'gemini':
        // TODO: Implement Gemini client
        throw new Error('Gemini provider not yet implemented')
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  /**
   * Stream from specific provider
   */
  private async *streamProvider(
    provider: AIProvider,
    model: AIModel,
    request: AICompletionRequest
  ): AsyncGenerator<AIStreamChunk> {
    switch (provider) {
      case 'openai':
        yield* streamOpenAI(request, model)
        break
      case 'anthropic':
        yield* streamAnthropic(request, model)
        break
      case 'gemini':
        throw new Error('Gemini streaming not yet implemented')
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  private getDefaultModelForProvider(provider: AIProvider): AIModel {
    switch (provider) {
      case 'openai':
        return 'gpt-5-turbo'
      case 'anthropic':
        return 'claude-4.5-sonnet-20250101'
      case 'gemini':
        return 'gemini-pro'
      default:
        return 'gpt-5-turbo'
    }
  }

  /**
   * Get available providers and their status
   */
  async getProviderStatus(): Promise<
    Record<AIProvider, { available: boolean; models: AIModel[] }>
  > {
    const statuses: any = {}

    for (const provider of ['openai', 'anthropic', 'gemini'] as AIProvider[]) {
      const available = await checkProviderHealth(provider)
      statuses[provider] = {
        available,
        models: this.getModelsForProvider(provider),
      }
    }

    return statuses
  }

  private getModelsForProvider(provider: AIProvider): AIModel[] {
    switch (provider) {
      case 'openai':
        return ['gpt-5-turbo', 'gpt-5', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
      case 'anthropic':
        return [
          'claude-4.5-sonnet-20250101',
          'claude-4.5-opus-20250101',
          'claude-3-5-sonnet-20241022',
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
        ]
      case 'gemini':
        return ['gemini-pro', 'gemini-ultra']
      default:
        return []
    }
  }
}

// Export singleton instance
let defaultClient: AIClient | null = null

export function getAIClient(
  userTier: 'free' | 'pro' | 'premium' | 'enterprise' = 'free',
  preferredProvider?: AIProvider
): AIClient {
  if (!defaultClient) {
    defaultClient = new AIClient(userTier, preferredProvider)
  }
  return defaultClient
}

// Convenience functions
export async function completeWithAI(
  prompt: string,
  systemPrompt?: string,
  options: {
    userTier?: 'free' | 'pro' | 'premium' | 'enterprise'
    feature?: string
    maxTokens?: number
    temperature?: number
  } = {}
): Promise<string> {
  const client = getAIClient(options.userTier)

  const messages: any[] = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: prompt })

  const response = await client.complete(
    {
      messages,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    },
    options.feature
  )

  return response.content
}
