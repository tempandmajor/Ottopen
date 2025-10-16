import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { FinalDraftExporter, FinalDraftElement } from '@/src/lib/export/final-draft-exporter'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch script data
    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .select('*, script_elements(*)')
      .eq('id', params.scriptId)
      .eq('user_id', user.id)
      .single()

    if (scriptError || !script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    // Convert script elements to Final Draft format
    const elements: FinalDraftElement[] = script.script_elements
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((elem: any) => ({
        type: elem.element_type as any,
        text: elem.content,
        sceneNumber: elem.scene_number,
        dualDialogue: elem.dual_dialogue || false,
      }))

    const fdxContent = await FinalDraftExporter.exportToFDX({
      title: script.title || 'Untitled Script',
      author: user.email || 'Unknown',
      elements,
      draftDate: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    })

    // Return as downloadable file
    return new NextResponse(fdxContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${script.title || 'script'}.fdx"`,
      },
    })
  } catch (error: any) {
    logger.error('Final Draft export error:', error)
    return NextResponse.json({ error: 'Export failed', details: error.message }, { status: 500 })
  }
}
