import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, ElementService } from '@/src/lib/script-service'
import { AIConversionService } from '@/src/lib/ai-conversion-service'

// POST /api/scripts/[scriptId]/convert - Convert script to different format
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
    const { target_format } = body

    if (!target_format) {
      return NextResponse.json({ error: 'target_format is required' }, { status: 400 })
    }

    const elements = await ElementService.getByScriptId(params.scriptId)

    let result

    // Handle different conversion types
    if (script.script_type === 'screenplay' && target_format === 'nonfiction_book') {
      result = await AIConversionService.screenplayToBookOutline(script, elements)
    } else if (script.script_type === 'nonfiction_book' && target_format === 'documentary') {
      result = await AIConversionService.bookToDocumentaryTreatment(script.title, elements)
    } else if (script.script_type === 'screenplay' && target_format === 'stage_play') {
      result = await AIConversionService.screenplayToStagePlay(script, elements)
    } else if (script.script_type === 'documentary' && target_format === 'screenplay') {
      result = await AIConversionService.documentaryToScreenplay(script, elements)
    } else if (script.script_type === 'stage_play' && target_format === 'screenplay') {
      result = await AIConversionService.stagePlayToScreenplay(script, elements)
    } else if (target_format === 'treatment') {
      result = await AIConversionService.toTreatment(script, elements)
    } else {
      return NextResponse.json(
        { error: `Conversion from ${script.script_type} to ${target_format} is not supported` },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Conversion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
