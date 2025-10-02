// AI Prompts for Writing Features
// Optimized for both Claude and GPT models

export const SYSTEM_PROMPTS = {
  expand: `You are an expert fiction writer and creative writing assistant. Your task is to expand and continue the story naturally, maintaining the author's voice, style, and tone.

Guidelines:
- Match the existing writing style, voice, and point of view
- Maintain consistency with established characters and plot
- Create vivid, engaging prose with sensory details
- Advance the plot or develop characters meaningfully
- Avoid clichés and purple prose
- Write in a way that flows seamlessly from the existing text`,

  rewrite: `You are an expert editor specializing in fiction. Your task is to rewrite the provided text according to the specific instructions while preserving the core meaning and intent.

Guidelines:
- Maintain the original story events and character actions
- Preserve important dialogue and character voice
- Improve clarity, pacing, and readability
- Enhance sensory details and emotional resonance
- Remove unnecessary words (if tightening)
- Ensure grammatical correctness`,

  describe: `You are a master of descriptive prose with expertise in creating immersive, multi-sensory descriptions for fiction. Your descriptions should transport readers directly into the scene.

Guidelines:
- Use all five senses (sight, sound, smell, taste, touch)
- Avoid generic or clichéd descriptions
- Show, don't tell - use specific, concrete details
- Match the tone and atmosphere of the story
- Use strong, precise verbs and nouns
- Vary sentence structure for rhythm
- Create emotional resonance through physical details`,

  brainstorm: `You are a creative brainstorming partner for fiction writers. Your task is to generate creative, unique, and compelling ideas that push beyond the obvious.

Guidelines:
- Generate diverse, surprising ideas
- Consider the genre and tone specified
- Think in terms of conflict, character, and consequence
- Avoid clichéd or overused tropes
- Provide enough detail to spark imagination
- Consider both plot and character implications
- Think about what would make readers unable to stop reading`,

  critique: `You are an expert manuscript critique specialist with deep knowledge of storytelling craft. Provide constructive, specific, and actionable feedback.

Guidelines:
- Focus on story-level issues (plot, character, pacing, tension)
- Identify both strengths and areas for improvement
- Be specific with examples and line references
- Suggest concrete solutions, not just problems
- Consider genre conventions and reader expectations
- Balance encouragement with honest assessment
- Prioritize the most important issues`,

  character: `You are a character development specialist for fiction writers. Create rich, complex, three-dimensional characters that feel real and compelling.

Guidelines:
- Give characters contradictions and flaws
- Create detailed, specific backstories that inform present behavior
- Develop unique voices and speech patterns
- Consider psychological depth and motivation
- Make characters active participants in their own stories
- Ensure character goals create conflict
- Think about character arcs and transformation`,

  outline: `You are a story structure expert who helps authors develop compelling plot outlines that work within established narrative frameworks.

Guidelines:
- Follow the specified story structure (Three-Act, Hero's Journey, etc.)
- Create clear cause-and-effect plot progression
- Build escalating conflict and rising tension
- Include key structural beats at appropriate percentages
- Balance plot, character, and theme
- Ensure each beat serves a clear narrative purpose
- Consider pacing and reader engagement throughout`,

  queryLetter: `You are a literary agent and query letter expert. Create compelling, professional query letters that grab attention and sell the manuscript.

Guidelines:
- Hook with a strong opening sentence
- Present the core conflict and stakes clearly
- Match the tone to the book's genre
- Keep it concise (250-350 words)
- Include relevant comp titles
- Make the author's credentials compelling
- Follow standard query format`,

  synopsis: `You are a synopsis specialist who distills novels into clear, engaging summaries that showcase the full story arc.

Guidelines:
- Include beginning, middle, and end (yes, spoil the ending)
- Focus on the main plot and protagonist
- Show character transformation
- Highlight key turning points
- Maintain narrative tension
- Write in third person, present tense
- Be clear and direct, avoiding flowery language`,
}

export interface ExpandRequest {
  contextBefore: string // Text before cursor
  contextAfter?: string // Text after cursor (optional)
  length: 'sentence' | 'paragraph' | 'page'
  genre?: string
  tone?: string
  pov?: 'first-person' | 'second-person' | 'third-limited' | 'third-omniscient'
  tense?: 'present' | 'past' | 'future'
  additionalInstructions?: string
}

export function buildExpandPrompt(request: ExpandRequest): string {
  const lengthGuide = {
    sentence: '1-2 sentences',
    paragraph: '1-2 paragraphs (150-250 words)',
    page: '1 full page (400-500 words)',
  }

  const povInstructions = request.pov
    ? {
        'first-person': 'MAINTAIN FIRST PERSON POV (I, me, my)',
        'second-person': 'MAINTAIN SECOND PERSON POV (you, your)',
        'third-limited': "MAINTAIN THIRD PERSON LIMITED POV (one character's perspective)",
        'third-omniscient': 'MAINTAIN THIRD PERSON OMNISCIENT POV',
      }[request.pov]
    : ''

  const tenseInstructions = request.tense
    ? {
        present: 'MAINTAIN PRESENT TENSE (walks, runs, says)',
        past: 'MAINTAIN PAST TENSE (walked, ran, said)',
        future: 'MAINTAIN FUTURE TENSE (will walk, will run, will say)',
      }[request.tense]
    : ''

  return `Continue this story naturally. Write approximately ${lengthGuide[request.length]}.

CONTEXT BEFORE:
${request.contextBefore.slice(-1000)} // Last 1000 characters

${request.contextAfter ? `CONTEXT AFTER:\n${request.contextAfter.slice(0, 500)}` : ''}

${request.genre ? `GENRE: ${request.genre}` : ''}
${request.tone ? `TONE: ${request.tone}` : ''}
${povInstructions ? `${povInstructions}` : ''}
${tenseInstructions ? `${tenseInstructions}` : ''}
${request.additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${request.additionalInstructions}` : ''}

Now continue the story naturally from where the "CONTEXT BEFORE" ends. Write ONLY the continuation, do not repeat the context.`
}

export interface RewriteRequest {
  text: string
  style:
    | 'vivid'
    | 'concise'
    | 'tense'
    | 'emotional'
    | 'pov-change'
    | 'tense-change'
    | 'formal'
    | 'casual'
  targetPOV?: 'first' | 'third-limited' | 'third-omniscient'
  targetTense?: 'past' | 'present'
  additionalInstructions?: string
  additionalContext?: string
}

export function buildRewritePrompt(request: RewriteRequest): string {
  const styleInstructions = {
    vivid:
      'Add rich sensory details and vivid imagery. Make the scene come alive with specific, concrete descriptions.',
    concise:
      'Tighten the prose by removing unnecessary words and strengthening weak verbs. Make every word count.',
    tense: 'Increase tension and suspense. Add urgency, raise stakes, and create more conflict.',
    emotional:
      "Deepen the emotional resonance. Show the character's internal experience and feelings more vividly.",
    'pov-change': `Change the point of view to ${request.targetPOV || 'third person limited'}.`,
    'tense-change': `Change the verb tense to ${request.targetTense || 'past'} tense.`,
    formal: 'Make the tone more formal and literary.',
    casual: 'Make the tone more casual and conversational.',
  }

  return `Rewrite the following text.

ORIGINAL TEXT:
${request.text}

REWRITE INSTRUCTIONS:
${styleInstructions[request.style]}
${request.additionalInstructions ? `\n${request.additionalInstructions}` : ''}

Provide ONLY the rewritten text, no explanations or comments.`
}

export interface DescribeRequest {
  subject: string // What to describe
  type: 'character' | 'location' | 'object' | 'action'
  context?: string // Story context
  senses?: ('sight' | 'sound' | 'smell' | 'taste' | 'touch')[]
  mood?: string
  atmosphere?: string
  timeOfDay?: string
  weather?: string
}

export function buildDescribePrompt(request: DescribeRequest): string {
  const sensoryFocus = request.senses?.length
    ? `Focus especially on: ${request.senses.join(', ')}`
    : 'Use all five senses (sight, sound, smell, taste, touch)'

  return `Create a vivid, immersive description of: ${request.subject}

TYPE: ${request.type}
${request.context ? `STORY CONTEXT: ${request.context}` : ''}
${request.mood ? `MOOD/ATMOSPHERE: ${request.mood}` : ''}
${request.timeOfDay ? `TIME OF DAY: ${request.timeOfDay}` : ''}
${request.weather ? `WEATHER: ${request.weather}` : ''}

REQUIREMENTS:
- ${sensoryFocus}
- Use specific, concrete details (not generic descriptions)
- Create emotional atmosphere through physical details
- Vary sentence structure for rhythm
- Avoid clichés
- Write 2-3 paragraphs

Provide ONLY the description, no explanations.`
}

export interface BrainstormRequest {
  type: 'plot' | 'character-name' | 'setting' | 'twist' | 'conflict' | 'theme'
  genre: string
  context?: string // Current story context
  count?: number // Number of ideas
}

export function buildBrainstormPrompt(request: BrainstormRequest): string {
  const count = request.count || 10

  const typeInstructions = {
    plot: `Generate ${count} unique plot ideas or directions the story could take. Include conflict, stakes, and potential resolution.`,
    'character-name': `Generate ${count} character names that fit the genre and cultural context. Include first and last names, and a brief note on the name's feel or origin.`,
    setting: `Generate ${count} unique, vivid settings that would work well for this genre. Include atmosphere and story potential.`,
    twist: `Generate ${count} plot twists that would surprise readers while feeling earned and logical within the story.`,
    conflict: `Generate ${count} compelling conflicts that could drive the story forward. Include internal and external conflicts.`,
    theme: `Generate ${count} thematic elements or symbolic threads that could add depth to the story.`,
  }

  return `${typeInstructions[request.type]}

GENRE: ${request.genre}
${request.context ? `CURRENT STORY CONTEXT: ${request.context}` : ''}

FORMAT: Provide each idea numbered, with a title and 2-3 sentence description.

Generate creative, specific ideas that push beyond obvious or clichéd choices.`
}

export interface CritiqueRequest {
  text: string
  focusAreas?: ('pacing' | 'dialogue' | 'show-vs-tell' | 'character' | 'plot' | 'prose')[]
}

export function buildCritiquePrompt(request: CritiqueRequest): string {
  const defaultFocus = ['pacing', 'dialogue', 'show-vs-tell', 'character', 'plot', 'prose']
  const focus = request.focusAreas?.length ? request.focusAreas : defaultFocus

  return `Provide detailed, constructive critique of this manuscript excerpt.

TEXT TO CRITIQUE:
${request.text}

FOCUS AREAS: ${focus.join(', ')}

Analyze:
1. STRENGTHS: What works well? Be specific.
2. AREAS FOR IMPROVEMENT: What needs work? Provide examples.
3. SPECIFIC SUGGESTIONS: How to fix identified issues.
4. OVERALL ASSESSMENT: Score (1-10) and summary.

Be constructive, specific, and actionable. Reference specific lines when possible.`
}

export interface CharacterRequest {
  name?: string
  role: 'protagonist' | 'antagonist' | 'supporting'
  genre: string
  age?: number
  traits?: string[]
  context?: string // Story context
}

export function buildCharacterPrompt(request: CharacterRequest): string {
  return `Create a detailed character profile for a ${request.role} in a ${request.genre} story.

${request.name ? `NAME: ${request.name}` : 'Generate an appropriate name'}
${request.age ? `AGE: ${request.age}` : ''}
${request.traits ? `DESIRED TRAITS: ${request.traits.join(', ')}` : ''}
${request.context ? `STORY CONTEXT: ${request.context}` : ''}

Provide a comprehensive profile including:
1. BASIC INFO: Name, age, occupation, appearance
2. PERSONALITY: Core traits, quirks, speech patterns
3. BACKGROUND: Family, education, formative events
4. PSYCHOLOGY: Internal goal, external goal, fear, lie they believe, truth they need
5. CHARACTER ARC: How they'll change
6. VOICE: How they speak and think

Make the character specific, complex, and three-dimensional with contradictions and depth.`
}

export interface OutlineRequest {
  premise: string
  genre: string
  structure: 'three-act' | 'heros-journey' | 'save-the-cat' | 'fichtean'
  targetWordCount?: number
}

export function buildOutlinePrompt(request: OutlineRequest): string {
  const structureGuides = {
    'three-act': 'Three-Act Structure (Setup 25%, Confrontation 50%, Resolution 25%)',
    'heros-journey': "Hero's Journey (12 stages from Ordinary World to Return with Elixir)",
    'save-the-cat': 'Save the Cat (15 beats from Opening Image to Final Image)',
    fichtean: 'Fichtean Curve (Rising action through crises to climax)',
  }

  return `Create a detailed story outline using the ${structureGuides[request.structure]}.

PREMISE: ${request.premise}
GENRE: ${request.genre}
${request.targetWordCount ? `TARGET LENGTH: ${request.targetWordCount} words` : ''}

Provide a complete outline with:
- Key plot points for each structural beat
- Character arcs
- Subplots
- Pacing guidance (approximate word count or percentage for each beat)
- Stakes and conflict escalation

Make it detailed enough to guide writing but flexible enough to allow creativity.`
}
