import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService } from '@/src/lib/script-service'
import { AIBookService } from '@/src/lib/ai-book-service'
import logger from '@/src/lib/logger'

// POST /api/scripts/[scriptId]/book/research - Generate research suggestions
export async function POST(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const script = await ScriptService.getById(params.scriptId)
    if (!script || script.user_id !== user.id) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    const body = await request.json()
    const { topic, context } = body

    const research = await AIBookService.generateResearchSuggestions(topic, context)

    return NextResponse.json(research)
  } catch (error) {
    logger.error('Research suggestions error:', error)
    return NextResponse.json({ error: 'Failed to generate research suggestions' }, { status: 500 })
  }
}
