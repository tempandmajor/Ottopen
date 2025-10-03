import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, ElementService } from '@/src/lib/script-service'
import { ScriptFormatter } from '@/src/lib/script-formatter'

// GET /api/scripts/[scriptId]/elements - Get all elements for a script
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

    const elements = await ElementService.getByScriptId(params.scriptId)

    return NextResponse.json({ elements })
  } catch (error: any) {
    console.error('Failed to get elements:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/scripts/[scriptId]/elements - Create elements (single or bulk)
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

    if (script.is_locked) {
      return NextResponse.json({ error: 'Script is locked' }, { status: 400 })
    }

    const body = await request.json()

    let elements

    // Check if this is a bulk import from plain text
    if (body.plainText) {
      const parsed = ScriptFormatter.parseText(body.plainText, script.script_type)
      elements = await ElementService.bulkCreate(params.scriptId, parsed)
    }
    // Check if this is a bulk array of elements
    else if (Array.isArray(body.elements)) {
      elements = await ElementService.bulkCreate(params.scriptId, body.elements)
    }
    // Single element creation
    else {
      elements = [await ElementService.create(params.scriptId, body)]
    }

    return NextResponse.json({ elements }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create elements:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
