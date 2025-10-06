import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

// Initialize AI clients
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const AI_PROVIDER = process.env.AI_PROVIDER || 'anthropic'

export interface AIRequest {
  prompt: string
  context?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
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
 * Main AI generation function with streaming support
 */
export async function generateAI(request: AIRequest): Promise<AIResponse | AIStreamResponse> {
  const { prompt, context, maxTokens = 2000, temperature = 0.7, stream = false } = request

  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt

  if (AI_PROVIDER === 'anthropic' && anthropic) {
    return generateWithAnthropic(fullPrompt, maxTokens, temperature, stream)
  } else if (AI_PROVIDER === 'openai' && openai) {
    return generateWithOpenAI(fullPrompt, maxTokens, temperature, stream)
  }

  throw new Error('No AI provider configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.')
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
    model: 'claude-3-5-sonnet-20241022',
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
    model: 'claude-3-5-sonnet-20241022',
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
    model: 'gpt-4-turbo-preview',
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
    model: 'gpt-4-turbo-preview',
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
