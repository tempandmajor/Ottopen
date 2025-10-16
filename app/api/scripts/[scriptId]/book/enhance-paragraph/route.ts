import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService } from '@/src/lib/script-service'
import { AIBookService } from '@/src/lib/ai-book-service'
import logger from '@/src/lib/logger'

// POST /api/scripts/[scriptId]/book/enhance-paragraph - Enhance paragraph
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
    const { paragraph, purpose } = body

    const result = await AIBookService.enhanceParagraph(paragraph, purpose)

    return NextResponse.json(result)
  } catch (error) {
    logger.error('Enhance paragraph error:', error)
    return NextResponse.json({ error: 'Failed to enhance paragraph' }, { status: 500 })
  }
}
