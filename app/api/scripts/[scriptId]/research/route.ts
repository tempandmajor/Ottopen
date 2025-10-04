import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { researchQuery } from '@/src/lib/ai/perplexity-client'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// POST /api/scripts/[scriptId]/research - Research with Perplexity (context-aware)
export async function POST(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { query, recencyFilter, scriptContext } = body

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Build context-aware system prompt if scriptContext is provided
    let contextualQuery = query

    if (scriptContext) {
      const contextParts: string[] = []

      if (scriptContext.scriptType) {
        contextParts.push(`Script Type: ${scriptContext.scriptType}`)
      }
      if (scriptContext.genre && scriptContext.genre.length > 0) {
        contextParts.push(`Genre: ${scriptContext.genre.join(', ')}`)
      }
      if (scriptContext.logline) {
        contextParts.push(`Logline: ${scriptContext.logline}`)
      }
      if (scriptContext.setting) {
        contextParts.push(`Setting: ${scriptContext.setting}`)
      }
      if (scriptContext.timePeriod) {
        contextParts.push(`Time Period: ${scriptContext.timePeriod}`)
      }

      if (contextParts.length > 0) {
        contextualQuery = `
SCREENPLAY RESEARCH:
${contextParts.join('\n')}

Tailor your research to be relevant to this screenplay's context, genre, and setting.

Query: ${query}
        `.trim()
      }
    }

    // Call Perplexity for research
    const result = await researchQuery(contextualQuery, {
      recencyFilter,
    })

    return NextResponse.json({
      success: true,
      answer: result.answer,
      citations: result.citations || [],
    })
  } catch (error: any) {
    console.error('Script research error:', error)
    return NextResponse.json({ error: error.message || 'Research failed' }, { status: 500 })
  }
}
