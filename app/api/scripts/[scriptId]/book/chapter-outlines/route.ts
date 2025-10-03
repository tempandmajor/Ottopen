import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService } from '@/src/lib/script-service'
import { AIBookService } from '@/src/lib/ai-book-service'

// POST /api/scripts/[scriptId]/book/chapter-outlines - Generate chapter outlines
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
    const { thesis, targetAudience, estimatedChapters } = body

    const outline = await AIBookService.generateChapterOutlines(
      script.title,
      thesis,
      targetAudience,
      estimatedChapters
    )

    return NextResponse.json(outline)
  } catch (error) {
    console.error('Chapter outlines error:', error)
    return NextResponse.json({ error: 'Failed to generate chapter outlines' }, { status: 500 })
  }
}
