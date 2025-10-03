import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, ProductionReportService } from '@/src/lib/script-service'

// GET /api/scripts/[scriptId]/report - Generate production report
export async function GET(request: NextRequest, { params }: { params: { scriptId: string } }) {
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

    const report = await ProductionReportService.generate(params.scriptId)

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error('Failed to generate production report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
