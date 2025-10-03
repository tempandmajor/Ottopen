// Cross-Format AI Conversion Service
// Convert between different writing formats (screenplay ↔ book ↔ documentary)

import Anthropic from '@anthropic-ai/sdk'
import type { ScriptElement, Script } from '@/src/types/script-editor'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface ConversionResult {
  target_format: string
  elements: Array<{
    element_type: string
    content: string
  }>
  metadata: {
    estimated_length: string
    conversion_notes: string[]
    warnings: string[]
  }
}

export interface OutlineConversion {
  title: string
  format: string
  outline: string[]
  structure_notes: string
  estimated_page_count: number
}

export class AIConversionService {
  /**
   * Convert screenplay to book outline
   */
  static async screenplayToBookOutline(
    script: Script,
    elements: ScriptElement[]
  ): Promise<OutlineConversion> {
    // Extract key story elements
    const scenes = elements.filter(el => el.element_type === 'scene_heading')
    const dialogue = elements.filter(el => el.element_type === 'dialogue')
    const action = elements.filter(el => el.element_type === 'action')

    const prompt = `Convert this screenplay into a non-fiction book outline about storytelling/screenwriting.

Title: "${script.title}"
Logline: "${script.logline || 'N/A'}"
Genre: ${script.genre?.join(', ') || 'N/A'}

Script has:
- ${scenes.length} scenes
- ${dialogue.length} dialogue blocks
- ${action.length} action blocks

Sample scenes:
${scenes
  .slice(0, 5)
  .map(s => s.content)
  .join('\n')}

Generate a book outline that:
1. Uses the screenplay as a case study
2. Teaches screenwriting principles
3. Includes 8-12 chapters
4. Each chapter covers a key aspect demonstrated in the script

Return as JSON:
{
  "title": "Book title based on screenplay",
  "format": "nonfiction_book",
  "outline": ["Chapter 1: Title and summary", "Chapter 2: ...", ...],
  "structure_notes": "How the book is organized",
  "estimated_page_count": 250
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }

  /**
   * Convert book chapter to documentary treatment
   */
  static async bookToDocumentaryTreatment(
    bookTitle: string,
    chapterContent: ScriptElement[]
  ): Promise<OutlineConversion> {
    const paragraphs = chapterContent.filter(el => el.element_type === 'paragraph')
    const headings = chapterContent.filter(el =>
      ['heading_1', 'heading_2', 'heading_3'].includes(el.element_type)
    )

    const prompt = `Convert this book chapter into a documentary treatment.

Book: "${bookTitle}"

Chapter structure:
${headings.map(h => `- ${h.content}`).join('\n')}

Key points (first 10 paragraphs):
${paragraphs
  .slice(0, 10)
  .map(p => p.content)
  .join('\n\n')}

Create a documentary treatment that:
1. Converts the chapter's thesis into a documentary narrative
2. Identifies interview subjects needed
3. Suggests B-roll and archive footage
4. Outlines a 4-act documentary structure

Return as JSON:
{
  "title": "Documentary title",
  "format": "documentary",
  "outline": ["Act 1: Setup", "Act 2: Development", ...],
  "structure_notes": "Documentary narrative approach",
  "estimated_page_count": 45
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }

  /**
   * Convert screenplay to stage play
   */
  static async screenplayToStagePlay(
    script: Script,
    elements: ScriptElement[]
  ): Promise<ConversionResult> {
    const prompt = `Convert this screenplay to stage play format.

Title: "${script.title}"
Total elements: ${elements.length}

Key changes needed:
1. Combine multiple locations into unified stage sets
2. Convert camera directions to stage directions
3. Add entrance/exit cues for characters
4. Adapt visual actions for live performance

Sample elements:
${elements
  .slice(0, 20)
  .map(el => `[${el.element_type}] ${el.content}`)
  .join('\n')}

Return as JSON:
{
  "target_format": "stage_play",
  "elements": [
    {"element_type": "scene_heading", "content": "ACT ONE"},
    {"element_type": "stage_direction", "content": "..."},
    ...
  ],
  "metadata": {
    "estimated_length": "90 minutes",
    "conversion_notes": ["Combined 15 locations into 3 stage sets", ...],
    "warnings": ["Scene 23 car chase cannot be staged literally", ...]
  }
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }

  /**
   * Convert documentary to screenplay
   */
  static async documentaryToScreenplay(
    script: Script,
    elements: ScriptElement[]
  ): Promise<ConversionResult> {
    const prompt = `Convert this documentary script into a narrative screenplay/docudrama.

Title: "${script.title}"

Documentary elements:
${elements
  .slice(0, 30)
  .map(el => `[${el.element_type}] ${el.content}`)
  .join('\n')}

Create a narrative screenplay that:
1. Converts narration into visual scenes
2. Transforms interviews into dramatic dialogue
3. Maintains the documentary's thesis as theme
4. Adds dramatic structure (protagonist, conflict, resolution)

Return as JSON:
{
  "target_format": "screenplay",
  "elements": [
    {"element_type": "scene_heading", "content": "INT. ..."},
    {"element_type": "action", "content": "..."},
    ...
  ],
  "metadata": {
    "estimated_length": "105 pages",
    "conversion_notes": ["Created composite protagonist from interview subjects", ...],
    "warnings": ["Some factual claims dramatized for narrative flow", ...]
  }
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }

  /**
   * Convert stage play to screenplay
   */
  static async stagePlayToScreenplay(
    script: Script,
    elements: ScriptElement[]
  ): Promise<ConversionResult> {
    const prompt = `Convert this stage play into a screenplay.

Title: "${script.title}"

Stage play elements:
${elements
  .slice(0, 30)
  .map(el => `[${el.element_type}] ${el.content}`)
  .join('\n')}

Adapt for film by:
1. Opening up stage-bound scenes to multiple locations
2. Converting stage directions to cinematic action
3. Adding visual storytelling opportunities
4. Breaking long scenes into shorter, cut-able moments

Return as JSON:
{
  "target_format": "screenplay",
  "elements": [
    {"element_type": "scene_heading", "content": "EXT. ..."},
    {"element_type": "action", "content": "..."},
    ...
  ],
  "metadata": {
    "estimated_length": "95 pages",
    "conversion_notes": ["Expanded single living room set to 8 locations", ...],
    "warnings": ["Some theatrical dialogue may need trimming for screen", ...]
  }
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }

  /**
   * Convert any format to summary/treatment
   */
  static async toTreatment(
    script: Script,
    elements: ScriptElement[]
  ): Promise<{
    title: string
    logline: string
    synopsis: string
    key_scenes: string[]
    themes: string[]
    target_audience: string
  }> {
    const prompt = `Create a treatment/synopsis for this ${script.script_type}.

Title: "${script.title}"
Type: ${script.script_type}
Genre: ${script.genre?.join(', ') || 'N/A'}

Content preview:
${elements
  .slice(0, 50)
  .map(el => `[${el.element_type}] ${el.content}`)
  .join('\n')}

Generate:
1. A compelling logline (1-2 sentences)
2. A 2-paragraph synopsis
3. Key scenes/chapters (5-7 bullets)
4. Main themes
5. Target audience

Return as JSON:
{
  "title": "Title",
  "logline": "One-sentence hook",
  "synopsis": "2-paragraph summary",
  "key_scenes": ["Scene/chapter 1", "Scene/chapter 2", ...],
  "themes": ["Theme 1", "Theme 2", ...],
  "target_audience": "Who this is for"
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }
}
