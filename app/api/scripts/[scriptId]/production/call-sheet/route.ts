import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { ProductionDocumentGenerator, CallSheet } from '@/src/lib/production/call-sheet-generator'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { shootDate, sceneNumbers, format = 'json' } = body

    // Fetch script and elements
    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .select('*, script_elements(*)')
      .eq('id', params.scriptId)
      .eq('user_id', user.id)
      .single()

    if (scriptError || !script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    // Convert to script content
    const scriptContent = script.script_elements
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((e: any) => e.content)
      .join('\n')

    // Parse scenes
    const allScenes = ProductionDocumentGenerator.parseScriptForProduction(scriptContent)

    // Filter to requested scenes if specified
    const scenes = sceneNumbers
      ? allScenes.filter(s => sceneNumbers.includes(s.sceneNumber))
      : allScenes

    // Generate call sheet
    const callSheet = ProductionDocumentGenerator.generateCallSheet(
      scenes,
      shootDate || new Date().toISOString().split('T')[0],
      {
        productionTitle: script.title,
        director: 'TBD',
        producer: 'TBD',
        productionCompany: 'TBD',
      }
    )

    if (format === 'html') {
      const html = ProductionDocumentGenerator.exportCallSheetToHTML(callSheet)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="call-sheet-${shootDate}.html"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      callSheet,
    })
  } catch (error: any) {
    console.error('Call sheet generation error:', error)
    return NextResponse.json(
      { error: 'Call sheet generation failed', details: error.message },
      { status: 500 }
    )
  }
}
