import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Export stateful AI modules
export * from './ai-conversation-manager'
export * from './ai-responses-api'
export * from './claude-memory-tool'

// Subscription tier type
export type SubscriptionTier = 'free' | 'pro' | 'studio'

// Tier limits configuration
export const TIER_LIMITS = {
  free: {
    maxTokensPerRequest: 500, // ~375 words output
    maxRequestsPerMonth: 10,
    provider: 'gemini', // Use free Gemini Flash
    features: ['basic'], // Limited features
  },
  pro: {
    maxTokensPerRequest: 2000, // ~1500 words output
    maxRequestsPerMonth: 100,
    provider: 'deepseek', // Cost-effective DeepSeek
    features: ['basic', 'advanced'], // Most features
  },
  studio: {
    maxTokensPerRequest: 4000, // ~3000 words output
    maxRequestsPerMonth: Infinity, // Unlimited
    provider: 'anthropic', // Premium Claude
    features: ['basic', 'advanced', 'premium'], // All features
  },
} as const

// Initialize AI clients
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// DeepSeek client (OpenAI-compatible)
const deepseek = process.env.DEEPSEEK_API_KEY
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    })
  : null

// Google Gemini client
const gemini = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null

const AI_PROVIDER = process.env.AI_PROVIDER || 'auto' // 'auto' uses tier-based routing

export interface AIRequest {
  prompt: string
  context?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
  userTier?: SubscriptionTier // New: tier-based limits
  userId?: string // For usage tracking
}

export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// Streaming response type
export type AIStreamResponse = AsyncIterable<string>

/**
 * Get provider based on tier and availability
 */
function getProviderForTier(tier: SubscriptionTier = 'free'): string {
  if (AI_PROVIDER !== 'auto') {
    return AI_PROVIDER
  }

  const tierConfig = TIER_LIMITS[tier]
  const preferredProvider = tierConfig.provider

  // Check if preferred provider is available, otherwise fallback
  if (preferredProvider === 'gemini' && gemini) return 'gemini'
  if (preferredProvider === 'deepseek' && deepseek) return 'deepseek'
  if (preferredProvider === 'anthropic' && anthropic) return 'anthropic'

  // Fallback chain
  if (deepseek) return 'deepseek' // Cheapest paid option
  if (anthropic) return 'anthropic'
  if (openai) return 'openai'
  if (gemini) return 'gemini'

  throw new Error(
    'No AI provider configured. Please set at least one: DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_API_KEY'
  )
}

/**
 * Apply tier limits to token count
 */
function applyTierLimits(maxTokens: number, tier: SubscriptionTier = 'free'): number {
  const tierLimit = TIER_LIMITS[tier].maxTokensPerRequest
  return Math.min(maxTokens, tierLimit)
}

/**
 * Main AI generation function with streaming support and tier-based routing
 */
export async function generateAI(request: AIRequest): Promise<AIResponse | AIStreamResponse> {
  const {
    prompt,
    context,
    maxTokens = 2000,
    temperature = 0.7,
    stream = false,
    userTier = 'free',
    userId,
  } = request

  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt

  // Apply tier limits
  const limitedMaxTokens = applyTierLimits(maxTokens, userTier)

  // Log usage for tracking (optional - could save to database)
  if (userId && process.env.NODE_ENV === 'production') {
    console.log(`AI request: user=${userId}, tier=${userTier}, tokens=${limitedMaxTokens}`)
  }

  // Get provider based on tier
  const provider = getProviderForTier(userTier)

  // Route to appropriate provider
  if (provider === 'anthropic' && anthropic) {
    return generateWithAnthropic(fullPrompt, limitedMaxTokens, temperature, stream)
  } else if (provider === 'openai' && openai) {
    return generateWithOpenAI(fullPrompt, limitedMaxTokens, temperature, stream)
  } else if (provider === 'deepseek' && deepseek) {
    return generateWithDeepSeek(fullPrompt, limitedMaxTokens, temperature, stream)
  } else if (provider === 'gemini' && gemini) {
    return generateWithGemini(fullPrompt, limitedMaxTokens, temperature, stream)
  }

  throw new Error(
    `Provider ${provider} is not available. Please configure the appropriate API key.`
  )
}

/**
 * Anthropic (Claude) implementation
 */
async function generateWithAnthropic(
  prompt: string,
  maxTokens: number,
  temperature: number,
  stream: boolean
): Promise<AIResponse | AIStreamResponse> {
  if (!anthropic) throw new Error('Anthropic client not initialized')

  if (stream) {
    return generateAnthropicStream(prompt, maxTokens, temperature)
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5', // Claude Sonnet 4.5 (Sept 29, 2025) - Best coding model
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''

  return {
    content,
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  }
}

async function* generateAnthropicStream(
  prompt: string,
  maxTokens: number,
  temperature: number
): AIStreamResponse {
  if (!anthropic) throw new Error('Anthropic client not initialized')

  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-5', // Claude Sonnet 4.5 (Sept 29, 2025) - Best coding model
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}

/**
 * OpenAI implementation
 */
async function generateWithOpenAI(
  prompt: string,
  maxTokens: number,
  temperature: number,
  stream: boolean
): Promise<AIResponse | AIStreamResponse> {
  if (!openai) throw new Error('OpenAI client not initialized')

  if (stream) {
    return generateOpenAIStream(prompt, maxTokens, temperature)
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-5', // GPT-5 (Aug 7, 2025) - 45% fewer factual errors, SOTA coding
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.choices[0]?.message?.content || ''

  return {
    content,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  }
}

async function* generateOpenAIStream(
  prompt: string,
  maxTokens: number,
  temperature: number
): AIStreamResponse {
  if (!openai) throw new Error('OpenAI client not initialized')

  const stream = await openai.chat.completions.create({
    model: 'gpt-5', // GPT-5 (Aug 7, 2025) - 45% fewer factual errors, SOTA coding
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}

/**
 * DeepSeek implementation (OpenAI-compatible API)
 *
 * CONTEXT CACHING: Enabled by default (no code changes needed)
 * - Automatically caches common prefixes (64-token chunks)
 * - 90% cost reduction on repeated prompts
 * - 13s → 500ms latency improvement
 * - Usage tracking: prompt_cache_hit_tokens, prompt_cache_miss_tokens
 */
async function generateWithDeepSeek(
  prompt: string,
  maxTokens: number,
  temperature: number,
  stream: boolean
): Promise<AIResponse | AIStreamResponse> {
  if (!deepseek) throw new Error('DeepSeek client not initialized')

  if (stream) {
    return generateDeepSeekStream(prompt, maxTokens, temperature)
  }

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat', // DeepSeek V3.2-Exp (auto-updates to latest, Oct 2025)
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.choices[0]?.message?.content || ''

  // Log cache performance (if available)
  const cacheHits = (response.usage as any)?.prompt_cache_hit_tokens || 0
  const cacheMisses = (response.usage as any)?.prompt_cache_miss_tokens || 0
  if (cacheHits > 0) {
    console.log(`[DeepSeek Cache] Hit: ${cacheHits} tokens, Miss: ${cacheMisses} tokens`)
  }

  return {
    content,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  }
}

async function* generateDeepSeekStream(
  prompt: string,
  maxTokens: number,
  temperature: number
): AIStreamResponse {
  if (!deepseek) throw new Error('DeepSeek client not initialized')

  const stream = await deepseek.chat.completions.create({
    model: 'deepseek-chat', // DeepSeek V3.2-Exp (auto-updates to latest, Oct 2025)
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}

/**
 * Google Gemini implementation
 *
 * IMPLICIT CACHING: Enabled by default for Gemini 2.5 models
 * - Automatic cost savings passed to you
 * - Minimum tokens: 1024 (Flash), 2048 (Pro)
 * - No code changes needed
 * - FREE tier still available with caching benefits
 */
async function generateWithGemini(
  prompt: string,
  maxTokens: number,
  temperature: number,
  stream: boolean
): Promise<AIResponse | AIStreamResponse> {
  if (!gemini) throw new Error('Gemini client not initialized')

  const model = gemini.getGenerativeModel({
    model: 'gemini-2.5-flash', // Gemini 2.5 Flash (Sept 25, 2025) - FREE tier, improved agentic tool use
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  })

  if (stream) {
    return generateGeminiStream(model, prompt)
  }

  const result = await model.generateContent(prompt)
  const response = result.response
  const content = response.text()

  // Gemini 2.5 has implicit caching - cost savings automatic
  console.log('[Gemini] Implicit caching enabled (automatic cost savings)')

  // Gemini doesn't provide token usage in free tier
  return {
    content,
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    },
  }
}

async function* generateGeminiStream(model: any, prompt: string): AIStreamResponse {
  const result = await model.generateContentStream(prompt)

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) {
      yield text
    }
  }
}

/**
 * AI Features for the Editor
 */

export async function expandText(
  text: string,
  targetLength: number = 500
): Promise<AIResponse | AIStreamResponse> {
  const prompt = `Expand the following text to approximately ${targetLength} words while maintaining the original tone, style, and meaning. Add vivid details, sensory descriptions, and deeper character insights where appropriate.

Original text:
${text}

Expanded version:`

  return generateAI({ prompt, maxTokens: targetLength * 2 })
}

export async function rewriteText(
  text: string,
  style: 'formal' | 'casual' | 'dramatic' | 'humorous' | 'poetic'
): Promise<AIResponse | AIStreamResponse> {
  const styleDescriptions = {
    formal: 'professional, sophisticated, and refined language',
    casual: 'conversational, relaxed, and accessible language',
    dramatic: 'intense, emotional, and powerful language',
    humorous: 'witty, entertaining, and lighthearted language',
    poetic: 'lyrical, metaphorical, and evocative language',
  }

  const prompt = `Rewrite the following text using ${styleDescriptions[style]}. Maintain the core meaning and narrative flow.

Original text:
${text}

Rewritten version:`

  return generateAI({ prompt, maxTokens: 1500 })
}

export async function describeScene(prompt: string): Promise<AIResponse | AIStreamResponse> {
  const fullPrompt = `Create a vivid, detailed scene description based on this prompt: "${prompt}"

Include:
- Sensory details (sight, sound, smell, touch, taste)
- Atmospheric elements
- Character positioning and actions
- Emotional undertones

Scene description:`

  return generateAI({ prompt: fullPrompt, maxTokens: 1000 })
}

export async function brainstormIdeas(
  topic: string,
  count: number = 5
): Promise<AIResponse | AIStreamResponse> {
  const prompt = `Generate ${count} creative and diverse ideas related to: "${topic}"

Each idea should be:
- Unique and thought-provoking
- Feasible for a story
- Accompanied by a brief explanation

Ideas:`

  return generateAI({ prompt, maxTokens: 1500 })
}

export async function critiqueText(text: string): Promise<AIResponse | AIStreamResponse> {
  const prompt = `Provide a constructive critique of the following text. Focus on:
- Story structure and pacing
- Character development
- Dialogue quality
- Show vs tell balance
- Prose style and clarity
- Suggestions for improvement

Text to critique:
${text}

Critique:`

  return generateAI({ prompt, maxTokens: 2000, temperature: 0.5 })
}

export async function detectPlotHoles(text: string): Promise<AIResponse | AIStreamResponse> {
  const prompt = `Analyze the following story text for plot holes, inconsistencies, and logical issues:

${text}

Provide a detailed analysis including:
1. Identified plot holes or inconsistencies
2. Timeline issues
3. Character motivation problems
4. Logic gaps
5. Suggested fixes for each issue

Analysis:`

  return generateAI({ prompt, maxTokens: 2000, temperature: 0.3 })
}

export async function checkCharacterConsistency(
  characterName: string,
  scenes: string[]
): Promise<AIResponse | AIStreamResponse> {
  const prompt = `Analyze the consistency of the character "${characterName}" across these scenes:

${scenes.map((scene, i) => `Scene ${i + 1}:\n${scene}`).join('\n\n')}

Check for:
1. Personality consistency
2. Voice and dialogue patterns
3. Behavioral consistency
4. Character arc progression
5. Any contradictions or inconsistencies

Analysis:`

  return generateAI({ prompt, maxTokens: 2000, temperature: 0.3 })
}

export async function generateShortStoryStructure(
  premise: string,
  targetWordCount: number,
  genre?: string
): Promise<AIResponse | AIStreamResponse> {
  const genreContext = genre ? ` in the ${genre} genre` : ''

  const prompt = `Create a complete short story structure${genreContext} for a ${targetWordCount}-word story based on this premise:

"${premise}"

Provide:
1. **Opening Hook** (${Math.round(targetWordCount * 0.1)} words): How the story begins
2. **Rising Action** (${Math.round(targetWordCount * 0.3)} words): Build tension and develop conflict
3. **Climax** (${Math.round(targetWordCount * 0.2)} words): Peak moment of tension
4. **Falling Action** (${Math.round(targetWordCount * 0.2)} words): Consequences unfold
5. **Resolution** (${Math.round(targetWordCount * 0.2)} words): Story conclusion

Include:
- Character names and brief descriptions
- Key plot points for each section
- Emotional beats
- Pacing recommendations
- Suggested page count per section (assuming 250 words per page)

Structure:`

  return generateAI({ prompt, maxTokens: 3000, temperature: 0.7 })
}

export async function generateShortStoryOutline(
  genre: string,
  theme: string,
  wordCount: number
): Promise<AIResponse | AIStreamResponse> {
  const pageCount = Math.ceil(wordCount / 250)

  const prompt = `Create a detailed outline for a ${wordCount}-word (approximately ${pageCount} pages) short story in the ${genre} genre exploring the theme: "${theme}".

Provide:
1. **Title Suggestions** (3 options)
2. **Logline** (1-2 sentences)
3. **Characters**:
   - Protagonist (name, age, key traits, motivation)
   - Antagonist/obstacle (if applicable)
   - Supporting characters (1-2)

4. **Story Structure** (with word count allocations):
   - Opening (${Math.round(wordCount * 0.15)} words / ${Math.ceil((wordCount * 0.15) / 250)} pages): Setup and hook
   - Development (${Math.round(wordCount * 0.35)} words / ${Math.ceil((wordCount * 0.35) / 250)} pages): Conflict escalation
   - Climax (${Math.round(wordCount * 0.2)} words / ${Math.ceil((wordCount * 0.2) / 250)} pages): Turning point
   - Resolution (${Math.round(wordCount * 0.3)} words / ${Math.ceil((wordCount * 0.3) / 250)} pages): Conclusion

5. **Scene Breakdown**: 3-5 key scenes with brief descriptions
6. **Thematic Elements**: How the theme is explored
7. **Writing Tips**: Specific techniques for this genre and length

Outline:`

  return generateAI({ prompt, maxTokens: 3000, temperature: 0.8 })
}

export async function suggestShortStoryTitle(
  premise: string,
  genre?: string
): Promise<AIResponse | AIStreamResponse> {
  const genreContext = genre ? ` in the ${genre} genre` : ''

  const prompt = `Suggest 10 compelling, memorable titles for a short story${genreContext} with this premise:

"${premise}"

Each title should be:
- Evocative and intriguing
- Appropriate for the genre
- Between 1-6 words
- Include a brief explanation of why it works

Titles:`

  return generateAI({ prompt, maxTokens: 1500 })
}

export async function analyzeReadability(text: string): Promise<AIResponse> {
  const prompt = `Analyze the readability and accessibility of this text:

${text}

Provide:
1. **Reading Level**: Estimated grade level
2. **Sentence Complexity**: Analysis of sentence structure
3. **Vocabulary**: Word choice assessment
4. **Pacing**: Flow and rhythm analysis
5. **Accessibility Score**: 1-10 rating with explanation
6. **Recommendations**: Specific suggestions to improve clarity

Analysis:`

  const response = await generateAI({ prompt, maxTokens: 1500, temperature: 0.3 })
  return response as AIResponse
}

export async function generateDialogue(
  character1: string,
  character2: string,
  situation: string,
  tone: 'tense' | 'casual' | 'romantic' | 'confrontational' | 'humorous'
): Promise<AIResponse | AIStreamResponse> {
  const prompt = `Write a ${tone} dialogue between ${character1} and ${character2} in this situation:

${situation}

Create 8-12 exchanges that:
- Reveal character personalities
- Advance the scene
- Feel natural and authentic
- Match the ${tone} tone
- Include appropriate action beats

Dialogue:`

  return generateAI({ prompt, maxTokens: 2000 })
}
