import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService } from '@/src/lib/script-service'
import { AIDocumentaryService } from '@/src/lib/ai-documentary-service'

// POST /api/scripts/[scriptId]/documentary/interview-questions - Generate interview questions
export async function POST(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const script = await ScriptService.getById(params.scriptId)
    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    if (script.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { subject, topic, context, duration } = body

    if (!subject || !topic) {
      return NextResponse.json({ error: 'subject and topic are required' }, { status: 400 })
    }

    const questions = await AIDocumentaryService.generateInterviewQuestions(
      subject,
      topic,
      context || '',
      duration || 30
    )

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Failed to generate interview questions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
