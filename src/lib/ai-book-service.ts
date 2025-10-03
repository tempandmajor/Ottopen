// Non-fiction Book AI Service
// Research assistance, citation management, chapter outlines, fact-checking

import Anthropic from '@anthropic-ai/sdk'
import type { ScriptElement } from '@/src/types/script-editor'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface ChapterOutline {
  chapter_number: number
  title: string
  subtitle?: string
  key_points: string[]
  estimated_word_count: number
  research_needed: string[]
}

export interface BookStructureOutline {
  title: string
  thesis: string
  target_audience: string
  chapters: ChapterOutline[]
  front_matter: string[]
  back_matter: string[]
  total_estimated_words: number
}

export interface ResearchSuggestion {
  topic: string
  questions: string[]
  potential_sources: string[]
  keywords: string[]
}

export interface FactCheck {
  claim: string
  element_id: string
  confidence: 'high' | 'medium' | 'low'
  verification_status: 'verified' | 'needs_citation' | 'questionable'
  suggested_sources: string[]
  notes: string
}

export interface CitationSuggestion {
  claim: string
  citation_type: 'book' | 'article' | 'website' | 'interview' | 'other'
  suggested_format: string
  search_terms: string[]
}

export class AIBookService {
  /**
   * Generate chapter outlines from book thesis
   */
  static async generateChapterOutlines(
    title: string,
    thesis: string,
    targetAudience: string,
    estimatedChapters: number = 10
  ): Promise<BookStructureOutline> {
    const prompt = `Generate a comprehensive chapter outline for this non-fiction book:

Title: "${title}"
Thesis: "${thesis}"
Target Audience: ${targetAudience}
Estimated Chapters: ${estimatedChapters}

Please provide:
1. A refined thesis statement
2. Front matter sections (Introduction, Preface, etc.)
3. Detailed chapter outlines with:
   - Chapter title and subtitle
   - 3-5 key points to cover
   - Estimated word count (aim for 3000-5000 words per chapter)
   - Research topics needed
4. Back matter sections (Conclusion, Appendices, Bibliography, etc.)

Return as JSON:
{
  "title": "Book Title",
  "thesis": "Refined thesis statement",
  "target_audience": "Target audience description",
  "chapters": [
    {
      "chapter_number": 1,
      "title": "Chapter Title",
      "subtitle": "Optional subtitle",
      "key_points": ["Point 1", "Point 2", ...],
      "estimated_word_count": 4000,
      "research_needed": ["Topic 1", "Topic 2", ...]
    }
  ],
  "front_matter": ["Introduction", "Preface", ...],
  "back_matter": ["Conclusion", "Appendix A", "Bibliography", ...],
  "total_estimated_words": 50000
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }

  /**
   * Generate research suggestions for a topic
   */
  static async generateResearchSuggestions(
    topic: string,
    context: string
  ): Promise<ResearchSuggestion> {
    const prompt = `Generate research guidance for this topic in a non-fiction book:

Topic: "${topic}"
Context: "${context}"

Provide:
1. Key research questions to answer
2. Potential sources to consult (types, not specific titles)
3. Search keywords for databases/libraries

Return as JSON:
{
  "topic": "Topic name",
  "questions": ["Question 1", "Question 2", ...],
  "potential_sources": ["Academic journals", "Industry reports", ...],
  "keywords": ["keyword1", "keyword2", ...]
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }

  /**
   * Fact-check claims in book content
   */
  static async factCheckContent(elements: ScriptElement[]): Promise<FactCheck[]> {
    // Extract paragraphs that make factual claims
    const paragraphs = elements
      .filter(el => el.element_type === 'paragraph')
      .map(el => ({
        id: el.id,
        content: el.content,
      }))

    const prompt = `Analyze these paragraphs from a non-fiction book and identify claims that need fact-checking or citations:

${paragraphs.map((p, i) => `[${i + 1}] ${p.content}`).join('\n\n')}

For each claim that needs verification:
1. Quote the specific claim
2. Assess confidence (high/medium/low) based on how verifiable it seems
3. Mark verification status:
   - verified: Common knowledge or obviously true
   - needs_citation: Specific fact/statistic requiring a source
   - questionable: Claim that seems dubious or needs validation
4. Suggest types of sources to verify

Return as JSON array:
[
  {
    "claim": "Exact quote of the claim",
    "element_id": "${paragraphs[0]?.id || 'example'}",
    "confidence": "medium",
    "verification_status": "needs_citation",
    "suggested_sources": ["Academic study", "Government report"],
    "notes": "Brief note about why this needs verification"
  }
]

Only flag claims that actually need verification. Skip obvious statements or opinions.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }

  /**
   * Suggest citations for specific claims
   */
  static async suggestCitations(claim: string, context: string): Promise<CitationSuggestion> {
    const prompt = `Suggest how to cite this claim in a non-fiction book:

Claim: "${claim}"
Context: "${context}"

Provide:
1. What type of source would best support this claim
2. A suggested citation format (APA, MLA, or Chicago)
3. Search terms to find appropriate sources

Return as JSON:
{
  "claim": "The claim text",
  "citation_type": "article",
  "suggested_format": "Author, A. A. (Year). Title of article. Journal Name, volume(issue), pages.",
  "search_terms": ["term1", "term2", ...]
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }

  /**
   * Improve paragraph structure and clarity
   */
  static async enhanceParagraph(
    paragraph: string,
    purpose: 'clarify' | 'strengthen' | 'shorten' | 'expand'
  ): Promise<{ original: string; enhanced: string; changes: string }> {
    const purposes = {
      clarify: 'Make this paragraph clearer and easier to understand',
      strengthen: 'Make the argument more compelling and well-supported',
      shorten: 'Make this more concise while preserving key points',
      expand: 'Add more detail and explanation',
    }

    const prompt = `${purposes[purpose]}:

Original:
${paragraph}

Return as JSON:
{
  "original": "Original text",
  "enhanced": "Improved version",
  "changes": "Brief explanation of what was changed and why"
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }

  /**
   * Generate bibliography from citations
   */
  static async formatBibliography(
    citations: Array<{
      authors: string[]
      title: string
      year?: number
      publisher?: string
      url?: string
      citation_type: string
    }>,
    style: 'APA' | 'MLA' | 'Chicago' = 'APA'
  ): Promise<string[]> {
    const prompt = `Format these citations in ${style} style:

${citations
  .map(
    (c, i) => `${i + 1}. Type: ${c.citation_type}
   Authors: ${c.authors.join(', ')}
   Title: ${c.title}
   Year: ${c.year || 'n.d.'}
   Publisher: ${c.publisher || 'N/A'}
   URL: ${c.url || 'N/A'}`
  )
  .join('\n\n')}

Return as JSON array of formatted citations:
["Citation 1", "Citation 2", ...]`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(response)
  }
}
