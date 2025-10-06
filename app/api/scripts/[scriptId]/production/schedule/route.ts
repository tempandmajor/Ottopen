import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { ProductionDocumentGenerator } from '@/src/lib/production/call-sheet-generator'

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
    const { totalShootDays = 10 } = body

    // Fetch script
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

    // Parse scenes and generate schedule
    const scenes = ProductionDocumentGenerator.parseScriptForProduction(scriptContent)
    const schedule = ProductionDocumentGenerator.generateShootingSchedule(scenes, totalShootDays)

    schedule.productionTitle = script.title

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error: any) {
    console.error('Shooting schedule generation error:', error)
    return NextResponse.json(
      { error: 'Schedule generation failed', details: error.message },
      { status: 500 }
    )
  }
}
